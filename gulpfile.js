import { src, dest, watch, parallel, series } from "gulp";
import rename from "gulp-rename";
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass';
import postcss from "gulp-postcss";
import uglify from "gulp-uglify";
import del from "del";
import browserSync from 'browser-sync';
import createZip from "gulp-zip";
import cssnano from "cssnano";
import newer from "gulp-newer";
import webp from "gulp-webp";
import include from "gulp-file-include";
import beautify from "gulp-beautify";
import fs from "fs";
import config from "./config.js";
import path from 'path';
import chokidar from "chokidar";

const { add_watch, paths, js_config, css_config, watcher } = config;

const bs = browserSync.create();
const sass = gulpSass(dartSass);

// Clean
export function clean() {
	return del(paths.clean);
}

// HTML
function html() {
	return src(paths.src.html)
		.pipe(include())
		.pipe(beautify.html({ indent_size: 1, indent_char: "\t" }))
		.pipe(dest(paths.build.html))
		.pipe(bs.stream());
}

function htmlComponents() {
	return src(paths.src.html_components)
		.pipe(include())
		.pipe(bs.stream());
}

// SCSS
const plugins = [
	cssnano(css_config)
];

function scss() {
	return src(paths.src.scss)
		.pipe(sass().on('error', sass.logError))
		.pipe(postcss(plugins))
		.pipe(rename({ basename: 'style', suffix: '.min' }))
		.pipe(dest(paths.build.css))
		.pipe(bs.stream());
}

function libsStyles() {
	return src(paths.src.libs.scss)
		.pipe(rename({ basename: 'libs', extname: ".scss" }))
		.pipe(dest(paths.src.scss_folder))
}

// JS
function js() {
	return src(paths.src.js)
		.pipe(uglify(js_config))
		.pipe(dest(paths.build.js))
		.pipe(bs.stream());
}

function libsScripts(cb) {
	return paths.src.libs.js.length ? src(paths.src.libs.js)
		.pipe(uglify(js_config))
		.pipe(concat('libs.min.js'))
		.pipe(dest(paths.build.js))
		.pipe(bs.stream()) : cb();
}

// Server
function server() {
	bs.init({
		server: { baseDir: paths.build.html },
		notify: false,
		open: false
	});
}

function serverOpen() {
	bs.init({
		server: { baseDir: paths.build.html },
		notify: false,
		open: true
	});
}

// Building the project into a folder
const packageData = JSON.parse(fs.readFileSync('package.json'));
const name = packageData.name;

export function folder() {
	return src([...paths.build.folder, `!./${name}.zip`])
		.pipe(dest(`./${name}`));
}

// Building the project into a zip-archive
export function zip() {
	return src(paths.build.main)
		.pipe(createZip(`${name}.zip`))
		.pipe(dest('dist/'));
}

async function gitignore(cb) {
	if(name) {
		const content = [
			'/node_modules',
			'/package-lock.json',
			`/${name}`,
			`/${name}.zip`
		].join('\n');
	
		fs.writeFile(paths.build.gitignore, content, () => {
			cb();
		});
	} else cb();
}

// Font conversion (TTF -> WOFF2)
export async function fonts() {
	const ttf2woff2 = (await import('gulp-ttf2woff2')).default;

	return src(paths.src.fonts, { encoding: false, removeBOM: false })
		.pipe(newer({
			dest: 'dist/fonts',
			ext: '.woff2'
		}))
		.pipe(ttf2woff2())
		.pipe(dest(paths.build.fonts))
}

// Image Optimization
async function otherImages() {
	const imagemin = (await import('gulp-imagemin')).default;

	return src(paths.src.img, { encoding: false })
		.pipe(newer(paths.build.img))
		.pipe(imagemin())

		.pipe(dest('dist/img'))
}

async function avifImages() {
	const avif = (await import('gulp-avif')).default;

	return src(paths.src.img_avif, { encoding: false })
		.pipe(newer(paths.build.img))
		.pipe(avif({ quality: 65 }))

		.pipe(dest(paths.build.img))
}

async function webpImages() {
	return src(paths.src.img, { encoding: false })
		.pipe(newer(paths.build.img))
		.pipe(webp())

		.pipe(dest(paths.build.img))
}

const images = series(avifImages, webpImages, otherImages);

// Just reload
async function reload(cb) {
	bs.reload();
	cb();
}

async function cleanFiles(deletedFile, extension, build_path, reload = false) {
	const parsed = path.parse(deletedFile);
	const baseName = parsed.name; // filename without extension

	// Forming masks for searching derived files
	const patterns = [];
	extension.map(extension => patterns.push(`${build_path}/${baseName}.${extension}`))

	await del(patterns);
	reload && bs.reload();
}

function json() {
	return src(paths.watch.json)
		.pipe(dest(paths.build.json))
}

function video() {
	return src(paths.watch.video)
		.pipe(dest(paths.build.video))
}

function audio() {
	return src(paths.watch.audio)
		.pipe(dest(paths.build.audio))
}

function sprites() {
	return src(paths.watch.sprites)
		.pipe(dest(paths.build.img))
}

// Watch
export function watchFiles() {
	watch(paths.watch.html, html);
	watch(paths.src.html_components, htmlComponents);
	watch(paths.watch.scss, scss);
	watch(paths.watch.js, js);
	watch(paths.watch.fonts, { events: "add" }, series(fonts, reload));
	watch(paths.src.img, { events: ["add", "change"] }, series(images, reload));
	watch(paths.watch.sprites, series(sprites, reload));

	const watcherImages = chokidar.watch(paths.src.img_folder, watcher),
		watcherFonts = chokidar.watch(paths.watch.fonts, watcher),
		watcherHTML = chokidar.watch(paths.watch.html_folder, watcher),
		watcherJS = chokidar.watch(paths.watch.js_folder, watcher);

	watcherImages.on('unlink', async (filePath) => {
		await cleanFiles(filePath, ["avif", "webp", "*"], paths.build.img, true);
	});

	watcherFonts.on('unlink', async (filePath) => {
		await cleanFiles(filePath, ["woff2"], paths.build.fonts, true);
	});

	watcherHTML.on('unlink', async (filePath) => {
		await cleanFiles(filePath, ["html"], paths.build.html);
	});

	watcherJS.on('unlink', async (filePath) => {
		await cleanFiles(filePath, ["js"], paths.build.js);
	});

	if (add_watch.json) {
		watch(paths.watch.json, { events: ["add", "change"] }, series(json, reload));

		const watcherJSON = chokidar.watch(paths.watch.json_folder, watcher);
		watcherJSON.on('unlink', async (filePath) => {
			await cleanFiles(filePath, ["json"], paths.build.json, true);
		});
	}

	if (add_watch.audio) {
		watch(paths.watch.audio, { events: ["add", "change"] }, series(audio, reload));

		const watcherAudio = chokidar.watch(paths.watch.audio_folder, watcher);
		watcherAudio.on('unlink', async (filePath) => {
			await cleanFiles(filePath, ["*"], paths.build.audio, true);
		});
	}

	if (add_watch.video) {
		watch(paths.watch.video, { events: ["add", "change"] }, series(video, reload));

		const watcherVideo = chokidar.watch(paths.watch.video_folder, watcher);
		watcherVideo.on('unlink', async (filePath) => {
			await cleanFiles(filePath, ["*"], paths.build.video, true);
		});
	}
}

// Build
const build = parallel(html, htmlComponents, scss, libsStyles, js, libsScripts);

async function nullName(cb) {
	return cb(new Error('The project name field is empty (package.json)'));
}

// Tasks
export { images };
export const open = name ? series(build, parallel(watchFiles, serverOpen)) : nullName;
export const start = name ? series(clean, build, gitignore, sprites, images, fonts, parallel(watchFiles, serverOpen)) : nullName;
export default name ? series(build, parallel(watchFiles, server)) : nullName;