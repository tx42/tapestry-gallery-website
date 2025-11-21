/**
 * @type {Element}
 */
let canvas;
/**
 * @type {HTMLCollectionOf<Element>}
 */
let points_of_interest;
/**
 * @type {Element}
 */
let info_screen_cont;

function resizeCanvas(){
	// ensure that the canvas is resized in such a way
	// that it isn't distorted and that it fills in the entire window
   canvas = document.getElementById("canvas");
   
   const img_ratio = canvas.clientWidth / canvas.clientHeight;
   const window_ratio = window.innerWidth / window.innerHeight;

	if(window_ratio < img_ratio){
		// window is to slim for the image
		// clamp height
		canvas.dataset["clamped"] = "height";
   }else{
		// window is to wide for the image
		// clamp width
		canvas.dataset["clamped"] = "width";
	}
}

let pan_lock = false;
let overlay_displayed = false;

let last_cursor_x;
let last_cursor_y;

function panWithCursor(cursor_x, cursor_y){
	last_cursor_x = cursor_x;
	last_cursor_y = cursor_y;

	if(pan_lock){
		return;
	}

	const window_w = window.innerWidth;
	const window_h = window.innerHeight;
	
	const u = cursor_x / window_w;
	const v = cursor_y / window_h;

	zoomTowards(u, v, 1, u, v);
}

function zoomTowards(img_u, img_v, zoom, foc_u=0.5, foc_v=0.5){
	const canvas_w = canvas.clientWidth;
	const canvas_h = canvas.clientHeight;
	// normalise canvas size cuz of transformation

	const window_w = window.innerWidth;
	const window_h = window.innerHeight;

	const focus_x =  window_w * foc_u;
	const focus_y =  window_h * foc_v;

	const corner_x = (canvas_w * zoom - window_w)/2;
	const corner_y = (canvas_h * zoom - window_h)/2;

	const canvas_x = img_u * canvas_w * zoom;
	const canvas_y = img_v * canvas_h * zoom;

	let disp_x = focus_x + corner_x - canvas_x;
	let disp_y = focus_y + corner_y - canvas_y;

	// clamp the displacements
	const max_disp_x = corner_x;
	const max_disp_y = corner_y;

	disp_x = Math.max(Math.min(disp_x, max_disp_x), -max_disp_x);
	disp_y = Math.max(Math.min(disp_y, max_disp_y), -max_disp_y);

	gsap.to("#canvas", {
		x: disp_x,
		y: disp_y,
		scale: zoom,
	});
}

function showInfoScreen(){
	overlay_displayed = true;
	gsap.to(info_screen_cont, {
		duration: 0.2,
		autoAlpha: 1,
	});
}

function hideInfoScreen(){
	overlay_displayed = false;
	gsap.to(info_screen_cont, {
		duration: 0.2,
		autoAlpha: 0,
	});
}

const poi_anim_max_dist = 100;
const poi_anim_min_dist = 30;

function animatePOIOpacity(cursor_x, cursor_y){
	for(let i = 0; i < points_of_interest.length; i++){
		const point_anchor = points_of_interest.item(i);
		const point_marker = point_anchor.querySelector(".point-marker");

		if(overlay_displayed){
			point_marker.style.opacity = 0;
			continue;
		}

		const rect = point_anchor.getBoundingClientRect();
		
		const distance_to_cursor = Math.sqrt(
			Math.pow(rect.x - cursor_x, 2) + Math.pow(rect.y - cursor_y, 2)
		);
		
		let opacity = (distance_to_cursor - poi_anim_min_dist) / (poi_anim_max_dist - poi_anim_min_dist);
		opacity = 1 - opacity;
		opacity = Math.max(opacity, 0);
		opacity = Math.min(opacity, 1);
		
		point_marker.style.opacity = opacity;
	}
}

/**
 * 
 * @param {Element} point_anchor 
 */
function showPointInfo(point_anchor){
	const info_el = point_anchor.querySelector(".interest-point-info");
	const info_screen = info_screen_cont.querySelector("#info-screen");
	info_screen.innerHTML = info_el.innerHTML;
	showInfoScreen();

	// zooming in
	const view_frame = document.getElementById("view-frame");
	const view_rect = view_frame.getBoundingClientRect();
	const focal_x = view_rect.x + view_rect.width / 2;
	const focal_y = view_rect.y + view_rect.height / 2;
	const focal_u = focal_x / window.innerWidth;
	const focal_v = focal_y / window.innerHeight;


	const img_u = parseFloat(point_anchor.style.left) / 100;
	const img_v = parseFloat(point_anchor.style.top) / 100;
	const zoom = point_anchor.dataset.zoom || 2;
	pan_lock = true;
	zoomTowards(img_u, img_v, zoom, focal_u, focal_v);

	animatePOIOpacity(Infinity, Infinity);
}

function hidePointInfo(){
	if(!overlay_displayed){
		return;
	}
	
	hideInfoScreen();
	pan_lock = false;
	panWithCursor(last_cursor_x, last_cursor_y);
}

function initialisePOICallbacks(){
	for(let i = 0; i < points_of_interest.length; i++){
		const point_anchor = points_of_interest.item(i);
		const marker = point_anchor.querySelector(".point-marker");

		marker.addEventListener("click", () => {
			showPointInfo(point_anchor);
		})
	}
}

window.addEventListener("resize", () => {
	resizeCanvas();
	panWithCursor(window.innerWidth/2, window.innerHeight/2);
});

window.addEventListener("load", () => {
	canvas = document.getElementById("canvas");
	info_screen_cont = document.querySelector(".info-screen-container");
	points_of_interest = document.getElementsByClassName("interest-point");
	initialisePOICallbacks();

	window.addEventListener("mousemove", (event) => {
		panWithCursor(event.x, event.y);
		animatePOIOpacity(event.x, event.y);
	});
	
	info_screen_cont.addEventListener("click", (event) => {
		hidePointInfo();
	});

	document.getElementById("info-screen").addEventListener("click", (event) => {
		event.stopPropagation();
	});
	
	const title_screen = document.getElementById("title-screen");
	title_screen.addEventListener("click", () => {
		gsap.to(title_screen, {
			duration: 0.5,
			autoAlpha: 0,
		});

		pan_lock = false;
		overlay_displayed = false;
	});

	resizeCanvas();
	animatePOIOpacity(Infinity, Infinity);
	panWithCursor(window.innerWidth/2, window.innerHeight/2);

	pan_lock = true;
	overlay_displayed = true;
});