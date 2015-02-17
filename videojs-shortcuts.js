
function shortcuts(options) {
	"use strict";

	// Set default player tabindex to handle keydown events
	if (!this.el().hasAttribute('tabIndex')) {
		this.el().setAttribute('tabIndex', '-1');
	}
	// get input focus on play
	this.on('play', function(event){
		this.el().focus();
	});

	this.contrast = 1;
	this.brightness = 1;
	this.setFilter = function(){
		this.el().style.filter = "contrast("+this.contrast+") brightness("+this.brightness+")";
		this.el().style.webkitFilter = "contrast("+this.contrast+") brightness("+this.brightness+")";
	};
	function adjustContrast(delta){
		this.contrast += delta;
		this.setFilter();
		this.osd("contrast: "+ Math.round(this.contrast * 10)/10);
	}
	function adjustBrightness(delta){
		this.brightness += delta;
		this.setFilter();
		this.osd("brightness: "+ Math.round(this.brightness * 10)/10);
	}
	function resetFilters(){
		this.contrast = 1;
		this.brightness = 1;
		this.setFilter();
		this.osd("reseted filters");
	}

	// osd overlay
	this.osd_overlay = document.createElement('div');
	this.osd_overlay.className = "osd";
	this.el().appendChild(this.osd_overlay);
	this.osd = function(text){
		//TODO
// 		var elm = this.osd_overlay;
// 		var newone = elm.cloneNode(true);
// 		newone.innerHTML = text;
// 		elm.parentNode.replaceChild(newone, elm);
// 		this.osd_overlay = elm;
	
		this.osd_overlay.innerHTML = text;
		// in case animation is running -> restart
		this.osd_overlay.classList.remove("fadeout");
		//triggering reflow -> recognizes classList change
		this.osd_overlay.offsetWidth = this.osd_overlay.offsetWidth; //FIXME: doesn't work in firefox
		// start animation
		this.osd_overlay.classList.add("fadeout");
		// remove class on end of animation
// 		var removefn = function(event){
// 			ani.classList.remove("fadeout");
// 		};
// 		ani.addEventListener('animationend', removefn, false);
// 		ani.addEventListener('webkitAnimationEnd', removefn, false);
	};

	function seek(delta){
		this.currentTime(Math.min(Math.max(this.currentTime() + delta, 0), this.duration()));
	}
	function pauseSeek(delta){
		if(!this.paused()){
			this.pause();
		}
		seek.call(this, delta);
	}
	function adjustVolume(delta){
		this.volume(this.volume() + delta);
	}
	function adjustSpeed(factor){
		this.playbackRate(this.playbackRate() * factor);
		this.osd("Speed: "+ Math.round(this.playbackRate() * 100)/100);
	}
	function resetSpeed(){
		this.playbackRate(1);
		this.osd("Speed: "+ Math.round(this.playbackRate() * 100)/100);
	}
	function togglePause(){
		if(this.paused()){
			this.play();
		}else{
			this.pause();
		}
	}
	function toggleMute(){
		this.muted(!this.muted());
	}
	function toggleFullscreen(){
		if(this.isFullscreen()){
			this.exitFullscreen();
		}else{
			this.requestFullscreen();
		}
	}

	function screenshot(){
		var video = this.el().querySelector('video');
		if(video){
			// take snapshot and display in img below
			var canvas = document.createElement('canvas');
			var ctx = canvas.getContext('2d'); //FIXME: firefox has problems
			var img = document.getElementById('snapshot'); //FIXME: generate it floating and delete it after close
			canvas.width = /*this.width();*/video.videoWidth;
			canvas.height = /*this.height();*/video.videoHeight;
			ctx.drawImage(video, 0, 0);
			img.src = canvas.toDataURL('image/png');
			
			this.pause();
			this.el().blur(); // loose keyboard focus on video
			img.scrollIntoView();
		}
	}

	function showHelp(){
		console.log("HELP!!!");//TODO
		//TODO: show list of shortcuts with description
	}

	//TODO: make it customizable with plugin options
	//TODO: when chromium supports key properly -> refactor by inlining some functions
	var opts = {
		"ArrowLeft": 	{ action: seek, param:   -10, desc: "Seek 10 seconds backward" },
		"Left": 		{ action: seek, param:   -10 },
		"ArrowRight":	{ action: seek, param:    10, desc: "Seek 10 seconds forward" },
		"Right":		{ action: seek, param:    10 },
		"ArrowUp":		{ action: seek, param:    60, desc: "Seek 1 minute forward" },
		"Up":			{ action: seek, param:    60 },
		"ArrowDown":	{ action: seek, param:   -60, desc: "Seek 1 minute backward" },
		"Down":			{ action: seek, param:   -60 },
		"PageUp":		{ action: seek, param:   600, desc: "Seek 10 minutes forward" },
		"PageDown":		{ action: seek, param:  -600, desc: "Seek 10 minutes backward" },
		".":			{ action: pauseSeek, param:  1/30, desc: "Seek one frame forward" }, //assumes 30 fps
		"U+00BE":		{ action: pauseSeek, param:  1/30 },
		",":			{ action: pauseSeek, param: -1/30, desc: "Seek one frame backward" },
		"U+00BC":		{ action: pauseSeek, param: -1/30 },

		" ":			{ action: togglePause, desc: "Pause/unpause" },
		"U+0020":		{ action: togglePause },
		"p":			{ action: togglePause},
		"U+0050":		{ action: togglePause},
		"m":			{ action: toggleMute, desc: "Toggle mute" },
		"U+004D":		{ action: toggleMute },
		"f":			{ action: toggleFullscreen, desc: "Toggle fullscreen" },
		"U+0046":		{ action: toggleFullscreen },

		"0":			{ action: adjustVolume, param:  0.1, desc: "Increase volume" },
		"U+0030":		{ action: adjustVolume, param:  0.1 },
		"9":			{ action: adjustVolume, param: -0.1, desc: "Decrease volume" },
		"U+0039":		{ action: adjustVolume, param: -0.1 },
		"1":			{ action: adjustContrast, param: -0.1, desc: "Decrease contrast" },
		"U+0031":		{ action: adjustContrast, param: -0.1 },
		"2":			{ action: adjustContrast, param:  0.1, desc: "Increase contrast" },
		"U+0032":		{ action: adjustContrast, param:  0.1 },
		"3":			{ action: adjustBrightness, param: -0.1, desc: "Decrease brightness" },
		"U+0033":		{ action: adjustBrightness, param: -0.1 },
		"4":			{ action: adjustBrightness, param:  0.1, desc: "Increase brightness" },
		"U+0034":		{ action: adjustBrightness, param:  0.1 },
		"r":			{ action: resetFilters },
		"U+0052":		{ action: resetFilters },

		"[":			{ action: adjustSpeed, param: 1/1.1 }, // multiplies by param
		"q":			{ action: adjustSpeed, param: 1/1.1 },
		"U+0051":		{ action: adjustSpeed, param: 1/1.1 },
		"]":			{ action: adjustSpeed, param:   1.1 },
		"w":			{ action: adjustSpeed, param:   1.1 },
		"U+0057":		{ action: adjustSpeed, param:   1.1 },
		"{":			{ action: adjustSpeed, param: 1/2 },
		"}":			{ action: adjustSpeed, param:   2 },
		"Backspace":	{ action: resetSpeed },
		"U+0008":		{ action: resetSpeed },

		"s":			{ action: screenshot },
		"U+0053":		{ action: screenshot },

		">":			{ action: this.next }, // no modifiers, so not accessible in chromium
		"n":			{ action: this.next },
		"U+004E":		{ action: this.next },
		"<": 			{ action: this.prev, desc: "Move to previous playlist item" },
		"U+00DC": 		{ action: this.prev },
		"b":			{ action: this.prev },
		"U+0042":		{ action: this.prev },

// 		"U+00DC": 		{ action: say, param: "chromium >", mod: "Shift" }, //FIXME: key is the same, not possible as dict key

		"h": 			{ action: showHelp }
	};

	this.on('keydown', function(event){
		var key = event.key || event.keyIdentifier; //fallback for chromium
		var ele = opts[key];
		if(ele){
			ele.action.call(this, ele.param); // use call to set this to player
			event.preventDefault();
		}
	});
}
videojs.plugin('shortcuts', shortcuts);
