import { src, dest, watch, parallel, series } from "gulp";
import * as dartSass from 'sass'
import gulpSass from 'gulp-sass';
import postcss from "gulp-postcss";
import postcssSortMediaQueries from "postcss-sort-media-queries";
import autoprefixer from "autoprefixer";
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
import config from "./gulp/config.js";
import path from 'path';
import chokidar from "chokidar";
import * as cheerio from 'cheerio';
import buffer from 'vinyl-buffer';
import through from 'through2';  
import { cleanOrphans } from "./gulp/utilities/clean-orphans.js";
import cleanFiles from "./gulp/utilities/clean-files.js";
import { globby } from "globby";

const { add_watch, paths, js_config, css_config, autoprefixer_config, sprites_config, watcher } = config;

const bs = browserSync.create();
const sass = gulpSass(dartSass);


// Deleting dist
export function clean() {
	return del(paths.clean);
}


// HTML
async function html() {
	const plumber = (await import('gulp-plumber')).default,
	notify = (await import('gulp-notify')).default;

	return src(paths.src.html)
	.pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
	.pipe(include())
	.pipe(beautify.html({ indent_size: 1, indent_char: "\t" }))
	.pipe(dest(paths.build.html))
	.pipe(bs.stream());
}

async function htmlComponents() {
	const plumber = (await import('gulp-plumber')).default,
	notify = (await import('gulp-notify')).default;

	return src(paths.src.html_components)
	.pipe(plumber({ errorHandler: notify.onError("Error: <%= error.message %>") }))
	.pipe(include());
}


// SCSS
const plugins = [
	postcssSortMediaQueries(),
	autoprefixer(autoprefixer_config),
	cssnano(css_config)
];

async function scss() {
	const concat = (await import('gulp-concat')).default;

	return src(paths.src.scss)
	.pipe(sass().on('error', sass.logError))
	.pipe(postcss(plugins))
	.pipe(concat("style.min.css"))
	.pipe(dest(paths.build.css))
	.pipe(bs.stream());
}

async function libsStyles() {
	const concat = (await import('gulp-concat')).default;

	return src(paths.src.libs.scss)
	.pipe(concat("libs.scss"))
	.pipe(dest(paths.src.scss_folder))
}


// Add import new style files
function updateStyleFile(addedFile = null, cb = () => { }, is_remove = false) {
	const MARKER = '// new';

	let content = '';
	if (fs.existsSync(paths.src.scss)) {
		content = fs.readFileSync(paths.src.scss, 'utf8');
	}

	const parts = content.split(MARKER);
	let newLine = '';

	if (addedFile && !is_remove) {
		const relativePath = path.relative(path.dirname(paths.src.scss), addedFile)
			.replace(/\\/g, '/')
			.replace(/\.scss$/, '');

		const importPattern1 = `@forward "${relativePath}";`;
		const importPattern2 = `// @forward "${relativePath}";`;
		const fileAlreadyIncluded = content.includes(importPattern1) || content.includes(importPattern2);

		if (!fileAlreadyIncluded) {
			newLine = `// @forward "${relativePath}";\n`;
		}
	}

	const newContent = parts[0] + MARKER + '\n' + newLine;
	fs.writeFileSync(paths.src.scss, newContent);
	cb();
}

function processStyleFile(filePath, action) {
	if (!fs.existsSync(paths.src.scss)) return;

	const relativePath = path.relative(path.dirname(paths.src.scss), filePath)
		.replace(/\\/g, '/')
		.replace(/\.scss$/, '');

	let content = fs.readFileSync(paths.src.scss, 'utf8');

	const pattern = `(//\\s*)?(@forward)\\s*['"]${relativePath.replace(/\//g, '\\/')}['"];?`;
	const regex = new RegExp(pattern, 'g');

	const newContent = content.replace(regex, match => {
		if (action === 'uncomment' && match.startsWith('//')) {
			return match.replace('//', '').trim();
		} else if (action === 'comment' && !match.startsWith('//')) {
			return `// ${match}`;
		}
		return match;
	});

	if (newContent !== content) {
		fs.writeFileSync(paths.src.scss, newContent);
	}
}


// JS
function js() {
	return src(paths.src.js)
	.pipe(uglify(js_config))
	.pipe(dest(paths.build.js))
	.pipe(bs.stream());
}

async function libsScripts(cb) {
	const concat = (await import('gulp-concat')).default;

	return paths.src.libs.js.length ? src(paths.src.libs.js)
	.pipe(uglify(js_config))
	.pipe(concat("libs.min.js"))
	.pipe(dest(paths.build.js))
	.pipe(bs.stream()) : cb();
}


// Add files
async function addFiles() {
	add_watch.map(params => {
		return src(`app/${params.folder}/*.${params.extname}`, { encoding: false })
		.pipe(dest(`dist/${params.folder}`))
	})
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
		notify: false
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


// .gitignore generator
async function gitignore(cb) {
	if (name) {
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
		dest: paths.build.fonts,
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

	.pipe(dest(paths.build.img))
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


// Icons (sprites)

export async function sprites() {
	const sprites = (await import('gulp-svg-sprite')).default;
	const glob = paths.src.sprites;
	const outputFile = path.join(paths.build.img, 'sprites.svg');

	try {
		// Получаем список SVG-файлов
		const files = await globby(glob);

		if (files.length === 0) {
			// Нет SVG — удаляем sprites.svg, если он есть
			await del(outputFile);
			console.log('No SVG files found. Deleted sprites.svg if it existed.');
			return;
		}
	} catch (err) {
		console.error('Error checking SVG files:', err);
		return;
	}

	return src(paths.src.sprites)
	.pipe(buffer())
	.pipe(through.obj(function(file, _, callback) {
		
		if (!file.contents) {
			console.error('Error: file does not contain data!');
			return callback();
		}

		const $ = cheerio.load(file.contents.toString(), { xmlMode: true });

		$('path').each((_, elem) => {
			const el = $(elem);
			if (el.attr('stroke')) {
				el.attr('stroke', 'currentColor');
				el.attr('fill', 'none');
			} else if (el.attr('fill')) {
				el.attr('fill', 'currentColor');
			}
		});

		file.contents = Buffer.from($.xml());
		this.push(file);

		callback();
	}))
	.pipe(sprites(sprites_config))
	.pipe(dest(paths.build.img));
}


function cleanOrphansSeries(cb) {
	cleanOrphans({
		ext: ['html'],
		appDir: 'app',
		distDir: 'dist',
		exclude: []
	});

	cleanOrphans({
		ext: ['js'],
		appDir: 'app/js',
		distDir: 'dist/js',
		exclude: ['libs.min.js']
	});

	cleanOrphans({
		ext: ['png', 'jpg'],
		appDir: 'app/img',
		distDir: 'dist/img',
		includeDerivedExt: ['webp', 'avif'],
	});

	cleanOrphans({
		ext: ['svg'],
		appDir: 'app/img',
		distDir: 'dist/img',
		exclude: ["sprites.svg"]
	});

	cleanOrphans({
		ext: ['ttf'],
		appDir: 'app/fonts',
		distDir: 'dist/fonts',
		includeDerivedExt: ['woff2']
	});

	if(add_watch.length) {
		add_watch.map(params => {
			cleanOrphans({
				ext: [params.extname],
				appDir: `app/${params.folder}`,
				distDir: `dist/${params.folder}`
			});
		})
	}
	
	cb();
}


// Watch files
export function watchFiles() {
	watch(paths.watch.html, html);
	watch(paths.src.html_components, series(htmlComponents, html));
	watch(paths.watch.scss, scss);
	watch(paths.watch.js, js);
	watch(paths.watch.fonts, { events: "add" }, series(fonts, reload));
	watch(paths.src.img, { events: ["add", "change"] }, series(images, reload));
	watch(paths.watch.sprites, series(sprites, reload));

	const watcherImages = chokidar.watch(paths.src.img_folder, watcher),
		watcherFonts = chokidar.watch(paths.watch.fonts, watcher),
		watcherHTML = chokidar.watch(paths.watch.html_folder, watcher),
		watcherSCSS = chokidar.watch(paths.watch.scss_folder, watcher),
		watcherJS = chokidar.watch(paths.watch.js_folder, watcher);

	watcherImages.on('unlink', async (filePath) => {
		await cleanFiles(filePath, ["avif", "webp", "*"], bs.reload);
	});

	watcherFonts.on('unlink', async (filePath) => {
		await cleanFiles(filePath, ["woff2"], bs.reload);
	});

	watcherHTML.on('unlink', async (filePath) => {
		await cleanFiles(filePath, ["html"]);
	});

	watcherJS.on('unlink', async (filePath) => {
		await cleanFiles(filePath, ["js"]);
	});

	watcherSCSS
		.on('unlink', pathString => {
			const parsed = path.parse(pathString);
			if (parsed.name[0] !== "-" && pathString.endsWith('.scss')) {
				processStyleFile(pathString, 'comment');
			}
		})
		.on('add', pathString => {
			const parsed = path.parse(pathString);
			if (parsed.name[0] !== "-" && pathString.endsWith('.scss')) {
				processStyleFile(pathString, 'uncomment');
				updateStyleFile(pathString, () => { });
			}
		})
		.on('error', error => console.error(`Watcher error: ${error}`));

	if (add_watch.length) {
		addFiles();
		add_watch.map(params => {
			watch(`app/${params.folder}/*.${params.extname}`, { events: ["add", "change"] }, series(() => {
				return src(`app/${params.folder}/*.${params.extname}`)
					.pipe(dest(`dist/${params.folder}`));
			}, reload));

			const watcherJSON = chokidar.watch(`app/${params.folder}`, watcher);
			watcherJSON.on('unlink', async (filePath) => {
				await cleanFiles(filePath, [params.extname], params.reload ? bs.reload : null);
			});
		})
	}
}


// Error
async function nullName(cb) {
	return cb(new Error('The project name field is empty (package.json)'));
}


// Build
const build = parallel(cleanOrphansSeries, html, htmlComponents, scss, libsStyles, js, libsScripts);


// Tasks
export { images };
export const open = name ? series(build, parallel(watchFiles, serverOpen)) : nullName;
export const build_open = name ? series(clean, build, gitignore, sprites, images, fonts, parallel(watchFiles, serverOpen)) : nullName;
export default name ? series(build, parallel(watchFiles, server)) : nullName;