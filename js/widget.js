function startFullscreen() {
	isFullscreen = true;
	$("#idle").hide();
	$("#full").show();
	
	try {
		widget.window.resizeWindow(480,800);
	} catch(e) {
		window.resizeTo(480,800);
	}

	loadMap();
}

function endFullscreen() {
	unloadMap();

	isFullscreen = false;
	$("#full").hide();
	$("#idle").show();

	try {
		widget.window.resizeWindow(400, 140);
	} catch (e) {
		window.resizeTo(400, 140);
	}
}

try {
	widget.addEventListener("widgetendkey", endFullscreen);
} catch (e) {}
