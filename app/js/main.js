
const 
	body = document.querySelector('body'),
	html = document.querySelector('html'),
	menu = document.querySelectorAll('.header__burger, .header__nav, body'),
	nav = document.querySelectorAll('.header__nav'),
	header = document.querySelector('.header');


// Click events

let mobileTimeline;

body.addEventListener('click', function (event) {

	function $(element) {
		return event.target.closest(element);
	}


	// Navigation menu in the header
	
	if ($('.header__burger')) {
	
		nav.forEach(nav => nav.classList.add('is-active-transition'))

		setTimeout(() => menu.forEach(element => element.classList.toggle('is-mobile-menu-active')), 0)

		mobileTimeline = setTimeout(() => nav.forEach(nav => nav.classList.remove('is-active-transition')), 350)
	
	}

})


// Aspect ratio for images

const imageAspectRatio = document.querySelectorAll('.image-aspect-ratio, figure img');
imageAspectRatio.forEach(imageAspectRatio => {
	const [ width, height ] = [imageAspectRatio.getAttribute('width'), imageAspectRatio.getAttribute('height')];
	if(width && height) imageAspectRatio.style.setProperty('--aspect-ratio', `${width}/${height}`);
})


// Resize

let windowSize = 0;

function resize() {

	header && html.style.setProperty("--height-header", header.offsetHeight + "px");

	html.style.setProperty("--vh", (window.innerHeight * 0.01).toFixed(2) + "px");
	//windowSize != window.innerWidth && html.style.setProperty("--svh", (window.innerHeight * 0.01).toFixed(2) + "px");

}

resize();

window.addEventListener('resize', resize)

/* 
// Animation on scroll

AOS.init({
	disable: "mobile",
	once: true
}); */
