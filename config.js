export default {
	add_watch: [
		/* {
			extname: "json",
			folder: "json",
			reload: true
		} */
	],
	paths: {
		build: {
			gitignore: ".gitignore",
			folder: ['./**', '!./node_modules/**', '!./package-lock.json'],
			main: "dist/**/*",
			html: 'dist',
			css: 'dist/css',
			js: 'dist/js',
			img: 'dist/img',
			fonts: 'dist/fonts',
			json: 'dist/json',
			audio: 'dist/audio',
			video: 'dist/video',
		},
		src: {
			html: 'app/*.html',
			html_components: 'app/html/**/*.html',
			scss: 'app/scss/style.scss',
			scss_folder: 'app/scss/',
			js: 'app/js/*.js',
			libs: {
				js: [
					//'node_modules/@splidejs/splide/dist/js/splide.min.js', // Slider | npm i @splidejs/splide --save | https://splidejs.com/guides/getting-started/
					//'node_modules/@splidejs/splide-extension-auto-scroll/dist/js/splide-extension-auto-scroll.min.js', // autoscroll for slider | $ npm install @splidejs/splide-extension-auto-scroll --save | https://splidejs.com/guides/getting-started/
					//'node_modules/@splidejs/splide-extension-grid/dist/js/splide-extension-grid.min.js', // grid for slider | npm install @splidejs/splide-extension-grid --save | https://splidejs.com/guides/getting-started/
					//'node_modules/vanilla-lazyload/dist/lazyload.min.js', // Lazyload img | npm i vanilla-lazyload --save | https://www.npmjs.com/package/vanilla-lazyload
					//'node_modules/smoothscroll-polyfill/dist/smoothscroll.min.js', // window.scroll() | npm i smoothscroll-polyfill --save
					//'node_modules/clipboard/dist/clipboard.min.js', // clipboard | npm i clipboard --save | https://www.npmjs.com/package/clipboard
					//'node_modules/aos/dist/aos.js', // Animation | npm i aos --save | https://www.npmjs.com/package/aos
					//'node_modules/gsap/dist/gsap.min.js', // GSAP (Animation) | npm i gsap --save | https://www.npmjs.com/package/gsap
					//'node_modules/gsap/dist/ScrollTrigger.min.js', // GSAP (Animation) | npm i gsap --save | https://www.npmjs.com/package/gsap
					//'node_modules/split-type/umd/index.min.js', // split text | npm i split-type --save | https://www.npmjs.com/package/split-type
					//'node_modules/@studio-freight/lenis/dist/lenis.min.js', // smooth scroll | npm i @studio-freight/lenis --save | https://github.com/studio-freight/lenis
					//'node_modules/@barba/core/dist/barba.umd.js', // smooth transitions between pages | npm install @barba/core --save | https://barba.js.org/docs/getstarted/intro/
					//'node_modules/slim-select/dist/slimselect.min.js', // Select | npm i slim-select --save | https://www.npmjs.com/package/slim-select
					//'node_modules/sticky-js/dist/sticky.min.js' // Sticky | npm i sticky-js --save | https://www.npmjs.com/package/sticky-js
					//'node_modules/nouislider/dist/nouislider.min.js', // Custom input[range] | npm i nouislider --save | https://www.npmjs.com/package/nouislider
					//'node_modules/simplebar/dist/simplebar.min.js', // Custom scrollbar | npm i simplebar --save | https://www.npmjs.com/package/simplebar
					//'node_modules/fslightbox/index.js', // Gallery | npm i fslightbox --save | https://www.npmjs.com/package/fslightbox
					//'node_modules/chart.js/dist/chart.min.js', // Chart | npm i chart.js --save | https://www.npmjs.com/package/chart.js
					//'node_modules/vanillajs-datepicker/dist/js/datepicker.min.js', // datepicker | npm install --save vanillajs-datepicker | https://mymth.github.io/vanillajs-datepicker/#/
					//'node_modules/swiper/swiper-bundle.min.js', // Slider
				],
				scss: [
					'node_modules/normalize.css/normalize.css',
					//'node_modules/@splidejs/splide/dist/css/splide.min.css', // Slider
					//'node_modules/@splidejs/splide/dist/css/splide-core.min.css', // Slider
					//'node_modules/swiper/swiper-bundle.min.css', // Slider
					//'node_modules/slim-select/dist/slimselect.css', // Select
					//'node_modules/aos/dist/aos.css', // Animation
					//'node_modules/nouislider/dist/nouislider.css', // custom input[range]
					//'node_modules/simplebar/dist/simplebar.min.css', // scrollbar
				]
			},
			img_avif: ['app/img/**/*.*', '!app/img/**/*.webp', '!app/img/**/*.svg'],
			img: ["app/img/**/*.*", '!app/img/sprites.svg'],
			img_folder: "app/img",
			fonts: 'app/fonts/**/*.{ttf,woff,woff2,eot,otf}',
		},
		watch: {
			html: 'app/**/*.html',
			scss: 'app/scss/**/*.scss',
			scss_folder: 'app/scss',
			js: 'app/js/**/*.js',
			js_folder: "app/js",
			html_folder: "app",
			fonts: 'app/fonts',
			img: ['app/img/**/*.{jpg,jpeg,png,gif,webp,svg}'],
			json: "app/json/*.json",
			json_folder: "app/json",
			video: "app/video/*.*",
			video_folder: "app/video",
			audio: "app/audio/*.*",
			audio_folder: "app/audio",
			sprites: "app/img/sprites.svg"
		},
		clean: './dist',
	},
	js_config: {
		output: {
			beautify: false,
			comments: false
		},
		compress: {
			passes: 3
		}
	},
	css_config: {
        preset: ["default", {
            discardComments: { removeAll: true },
            normalizeWhitespace: true,
            reduceIdents: true,
            mergeIdents: true,
            minifyFontValues: true,
        }]
    },
	watcher: {
		ignored: /(^|[\/\\])\../,
		persistent: true,
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 200,
			pollInterval: 100
		}
	}
}