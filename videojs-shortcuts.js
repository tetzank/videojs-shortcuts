
function shortcuts(options) {
// 	"use strict";

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
	this.osd_overlay.className = "vjs-osd vjs-outlined";
	this.el().appendChild(this.osd_overlay);
	this.osd = function(text){
		this.osd_overlay.innerHTML = text;
		// in case animation is running -> restart
		this.osd_overlay.classList.remove("fadeout");
		//triggering reflow -> recognizes classList change
		this.osd_overlay.offsetWidth = this.osd_overlay.offsetWidth;
		// start animation
		this.osd_overlay.classList.add("fadeout");
		// remove class on end of animation
		var removefn = function(event){
			this.classList.remove("fadeout");
		};
		this.osd_overlay.addEventListener('animationend', removefn, false);
		this.osd_overlay.addEventListener('webkitAnimationEnd', removefn, false);
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
	// FIXME: flash can't change playbackRate
	// this.player().tech && this.player().tech['featuresPlaybackRate'] used by playbackRate menu button
	// doesn't work, we don't have access to tech, maybe minified
	// does not work too: test this.techName !== "Html5"
	function adjustSpeed(factor){
		this.playbackRate(Math.round(this.playbackRate()*factor * 100)/100);
		this.osd("Speed: "+ this.playbackRate());
	}
	function resetSpeed(){
		this.playbackRate(1);
		this.osd("Speed: 1");
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

	this.centering = document.createElement('div');
	this.centering.className = "vjs-centering";
	this.centering.style.display = "none";
	this.centering.displays = {};
	this.centering.currentDisplay = null;
	this.centering.addDisplay = function(key, elements){
		this.displays[key] = elements;
		for(var i=0; i<elements.length; ++i){
			elements[i].style.display = "none";
			this.appendChild(elements[i]);
		}
	};
	this.centering.toggle = function(key){
		var ele, i;
		if(this.currentDisplay && this.currentDisplay!=key){
			ele = this.displays[this.currentDisplay];
			for(i=0; i<ele.length; ++i){
				ele[i].style.display = "none";
			}
		}
		ele = this.displays[key];
		var d = (ele[0].style.display=="none")? "block": "none";
		for(i=0; i<ele.length; ++i){
			ele[i].style.display = d;
		}
		this.style.display = d;
		this.currentDisplay = (d=="block")? key: null;
	};
	this.el().appendChild(this.centering);

	function showHelp(){
		// show list of shortcuts with description
		if(!this.helpscreen){
			var help_str = "";
			for(var key in opts){
				var o = opts[key];
				if(o.desc){
					if(o.complement){
						help_str += "<tr><td>"+key+" and "+o.complement+"</td><td>"+o.desc+"</td></tr>";
					}else{
						help_str += "<tr><td>"+key+"</td><td>"+o.desc+"</td></tr>";
					}
				}
			}
			this.helpscreen = document.createElement('div');
			this.helpscreen.className = "vjs-helpscreen";
			var tbl = document.createElement('table');
			tbl.innerHTML = help_str;
			this.helpscreen.appendChild(tbl);
			this.centering.addDisplay('help', [this.helpscreen]);
		}
		this.centering.toggle('help');
	}

	//TODO: when chromium supports key properly -> refactor by inlining some functions
	var opts = {
		"ArrowLeft": 	{ action: seek, param:  -10, desc: "Seek 10 seconds backward/forward", complement: "ArrowRight" },
		"Left": 		{ action: seek, param:  -10 },
		"ArrowRight":	{ action: seek, param:   10 },
		"Right":		{ action: seek, param:   10 },
		"ArrowUp":		{ action: seek, param:   60, desc: "Seek 1 minute forward/backward", complement: "ArrowDown" },
		"Up":			{ action: seek, param:   60 },
		"ArrowDown":	{ action: seek, param:  -60 },
		"Down":			{ action: seek, param:  -60 },
		"PageUp":		{ action: seek, param:  600, desc: "Seek 10 minutes forward/backward", complement: "PageDown" },
		"PageDown":		{ action: seek, param: -600 },
		".":			{ action: pauseSeek, param:  1/30, desc: "Seek one frame forward/backward", complement: "," }, //assumes 30 fps
		"U+00BE":		{ action: pauseSeek, param:  1/30 },
		",":			{ action: pauseSeek, param: -1/30 },
		"U+00BC":		{ action: pauseSeek, param: -1/30 },

		" ":			{ action: togglePause },
		"U+0020":		{ action: togglePause },
		"p":			{ action: togglePause, desc: "Pause/unpause" },
		"U+0050":		{ action: togglePause},
		"m":			{ action: toggleMute, desc: "Toggle mute" },
		"U+004D":		{ action: toggleMute },
		"f":			{ action: toggleFullscreen, desc: "Toggle fullscreen" },
		"U+0046":		{ action: toggleFullscreen },

		"0":			{ action: adjustVolume, param:  0.1, desc: "Increase/decrease volume", complement: "9" },
		"U+0030":		{ action: adjustVolume, param:  0.1 },
		"9":			{ action: adjustVolume, param: -0.1 },
		"U+0039":		{ action: adjustVolume, param: -0.1 },
		"1":			{ action: adjustContrast, param: -0.1 },
		"U+0031":		{ action: adjustContrast, param: -0.1 },
		"2":			{ action: adjustContrast, param:  0.1, desc: "Increase/decrease contrast", complement: "1" },
		"U+0032":		{ action: adjustContrast, param:  0.1 },
		"3":			{ action: adjustBrightness, param: -0.1 },
		"U+0033":		{ action: adjustBrightness, param: -0.1 },
		"4":			{ action: adjustBrightness, param:  0.1, desc: "Increase/decrease brightness", complement: "3" },
		"U+0034":		{ action: adjustBrightness, param:  0.1 },
		"r":			{ action: resetFilters, desc: "Reset all filters" },
		"U+0052":		{ action: resetFilters },

		"[":			{ action: adjustSpeed, param: 1/1.1 }, // multiplies by param
		"q":			{ action: adjustSpeed, param: 1/1.1 },
		"U+0051":		{ action: adjustSpeed, param: 1/1.1 },
		"]":			{ action: adjustSpeed, param:   1.1 },
		"w":			{ action: adjustSpeed, param:   1.1, desc: "Increase/decrease speed", complement: "q" },
		"U+0057":		{ action: adjustSpeed, param:   1.1 },
		"{":			{ action: adjustSpeed, param: 1/2 },
		"}":			{ action: adjustSpeed, param:   2 },
		"Backspace":	{ action: resetSpeed, desc: "Reset Speed" },
		"U+0008":		{ action: resetSpeed },

		"h": 			{ action: showHelp, desc: "Show/hide this help screen" },
		"U+0048":		{ action: showHelp }
	};
	// override standard opts with user defined options
	for(var attr in options){
		opts[attr] = options[attr];
	}

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
