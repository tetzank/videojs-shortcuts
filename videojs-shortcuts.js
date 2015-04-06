
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
		var ele;
		if(this.currentDisplay && this.currentDisplay!=key){
			ele = this.displays[this.currentDisplay];
			for(var i=0; i<ele.length; ++i){
				ele[i].style.display = "none";
			}
		}
		ele = this.displays[key];
		var d = (ele[0].style.display=="none")? "block": "none";
		for(var i=0; i<ele.length; ++i){
			ele[i].style.display = d;
		}
		this.style.display = d;
		this.currentDisplay = (d=="block")? key: null;
	};
	this.el().appendChild(this.centering);

	var scale;
	function updateScale(video){
		var rect = video.getBoundingClientRect();
		var scalew = player.snapshot.canvas.width / rect.width;
		var scaleh = player.snapshot.canvas.height / rect.height;
		scale = Math.max(Math.max(scalew, scaleh), 1);
		var scale_txt = document.getElementById('scale');
		scale_txt.innerHTML = Math.round(1/scale*100)/100;
	}
	function screenshot(){
		var center = this.centering;
		var el = this.el();
		var video = el.querySelector('video');
		if(video){
			if(!this.snapshot){
				this.snapshot = {};
				this.snapshot.parent = document.createElement('div');
				this.snapshot.parent.id = "canvas_parent";
				this.snapshot.container = document.createElement('div');
				this.snapshot.container.id = "canvas_container";
				this.snapshot.canvas = document.createElement('canvas');
				this.snapshot.container.appendChild(this.snapshot.canvas);
				this.snapshot.ctx = this.snapshot.canvas.getContext("2d");
				this.snapshot.canvas_rect = document.createElement('canvas');
				this.snapshot.canvas_rect.style.display = "none";
				this.snapshot.container.appendChild(this.snapshot.canvas_rect);
				this.snapshot.ctx_rect = this.snapshot.canvas_rect.getContext("2d");
				this.snapshot.cropbox = document.createElement('div');
				this.snapshot.cropbox.innerHTML = "crop";
				this.snapshot.cropbox.style.display = "none";
				this.snapshot.container.appendChild(this.snapshot.cropbox);

				var rect = video.getBoundingClientRect(); // use bounding rect instead of player.width/height because of fullscreen
				this.snapshot.canvas.style.maxWidth  = rect.width  +"px";
				this.snapshot.canvas.style.maxHeight = rect.height +"px";
				this.snapshot.parent.style.width = video.videoWidth +"px";
				this.snapshot.parent.style.height = video.videoHeight  +"px";
				this.snapshot.parent.style.maxWidth  = rect.width  +"px";
				this.snapshot.parent.style.maxHeight = rect.height +"px";
				
				var snapshot = this.snapshot;
				color.addEventListener('change', function(e){
					snapshot.ctx.strokeStyle = color.value;
				}, false);
				size.addEventListener('change', function(e){
					snapshot.ctx.lineWidth = size.value / 2;
				}, false);
				tool.addEventListener('change', function(){
					snapshot.cropbox.style.display = "none";
				}, false);

				snapshot.parent.appendChild(this.snapshot.container);
				center.addDisplay('snapshot', [this.snapshot.parent]);

				snapshot.cropbox.addEventListener('mousedown', function(e){
					console.log('cropping');
					var newcanvas = document.createElement('canvas');
					newcanvas.id = "canvas";
					newcanvas.width = scale * snapshot.cropbox.offsetWidth;
					newcanvas.height = scale * snapshot.cropbox.offsetHeight;
					newcanvas.style.maxWidth  = rect.width  +"px";
					newcanvas.style.maxHeight = rect.height +"px";

					var ctx = newcanvas.getContext("2d");
					ctx.drawImage(snapshot.canvas, scale*snapshot.cropbox.offsetLeft, scale*snapshot.cropbox.offsetTop,
									newcanvas.width, newcanvas.height, 0, 0, newcanvas.width, newcanvas.height);

					snapshot.container.replaceChild(newcanvas, snapshot.canvas);
					snapshot.canvas = newcanvas;
					ctx.lineCap = snapshot.ctx.lineCap; // transfer context states
					ctx.strokeStyle = snapshot.ctx.strokeStyle;
					ctx.lineWidth = snapshot.ctx.lineWidth;
					snapshot.ctx = ctx;
					updateScale(video);

					snapshot.cropbox.style.display = "none";
					e.stopPropagation(); //otherwise canvas below gets mousedown
				}, false);

				
				var paint = false;
				snapshot.container.addEventListener('mousedown', function(e){
					paint = true;
					var pos = snapshot.container.getBoundingClientRect();
					var x = e.clientX - pos.left;
					var y = e.clientY - pos.top;
					switch(tool.value){
						case "brush":
							x *= scale; y *= scale;
							snapshot.ctx.beginPath();
							snapshot.ctx.moveTo(x-1, y);
							snapshot.ctx.lineTo(x, y);
							snapshot.ctx.stroke();
							break;
						case "rectangle":
							// rectangle is scaled when blitting, not when dragging
							snapshot.canvas_rect.width = 0;
							snapshot.canvas_rect.height = 0;
							snapshot.canvas_rect.style.display = "block";
							snapshot.canvas_rect.style.left = x + "px";
							snapshot.canvas_rect.style.top = y + "px";
							break;
						case "crop":
							snapshot.cropbox.style.width = 0;
							snapshot.cropbox.style.height = 0;
							snapshot.cropbox.style.display = "flex";
							snapshot.cropbox.style.left = x + "px";
							snapshot.cropbox.style.top = y + "px";

							snapshot.cropbox.style.border = "1px dashed "+ color.value;
							snapshot.cropbox.style.color = color.value;
							break;
					}
			// 		e.preventDefault();
				}, false);

				snapshot.container.addEventListener('mousemove', function(e){
					if(paint){
						var pos = snapshot.container.getBoundingClientRect();
						var x = e.clientX - pos.left;
						var y = e.clientY - pos.top;
						switch(tool.value){
							case "brush":
								snapshot.ctx.lineTo(scale * x, scale * y);
								snapshot.ctx.stroke();
								break;
							case "rectangle":
								snapshot.ctx_rect.clearRect(0, 0, snapshot.ctx_rect.canvas.width, snapshot.ctx_rect.canvas.height);
								// this way it's only possible to drag to the right and down, mousedown sets top left
								snapshot.canvas_rect.width = x - snapshot.canvas_rect.offsetLeft; // resize canvas
								snapshot.canvas_rect.height = y - snapshot.canvas_rect.offsetTop;
								snapshot.ctx_rect.strokeStyle = color.value; //looks like its reset when resizing canvas
								snapshot.ctx_rect.lineWidth = size.value / scale; // scale lineWidth
								snapshot.ctx_rect.strokeRect(0, 0, snapshot.ctx_rect.canvas.width, snapshot.ctx_rect.canvas.height);
								break;
							case "crop":
								snapshot.cropbox.style.width = (x - snapshot.cropbox.offsetLeft) +"px"; // resize
								snapshot.cropbox.style.height = (y - snapshot.cropbox.offsetTop) +"px";
								break;
						}
						e.preventDefault();
					}
				}, false);

				function finish(){
					if(paint){
						paint = false;
						if(tool.value == "rectangle"){
							//blit snapshot.canvas_rect on canvas, scaled
							snapshot.ctx.drawImage(snapshot.canvas_rect,
									scale*snapshot.canvas_rect.offsetLeft, scale*snapshot.canvas_rect.offsetTop,
									scale*snapshot.ctx_rect.canvas.width, scale*snapshot.ctx_rect.canvas.height);
							snapshot.canvas_rect.style.display = "none";
						}
					}
				}
				snapshot.container.addEventListener('mouseup', finish, false);
				snapshot.container.addEventListener('mouseleave', finish, false);

				dljpeg.addEventListener('click', function(){
					window.open(snapshot.canvas.toDataURL("image/jpeg"));
				}, false);
				dlpng.addEventListener('click', function(){
					window.open(snapshot.canvas.toDataURL("image/png"));
				}, false);
			}

			this.snapshot.canvas.width = video.videoWidth;
			this.snapshot.canvas.height = video.videoHeight;
			this.snapshot.ctx.strokeStyle = color.value;
			this.snapshot.ctx.lineWidth = size.value / 2;
			updateScale(video);

			this.snapshot.ctx.drawImage(video, 0, 0);

			center.toggle('snapshot');
			paintcontrols.style.visibility = "visible";

			this.pause();
			el.blur(); // loose keyboard focus on video
		}
	}

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

		"s":			{ action: screenshot, desc: "Take snapshot" },
		"U+0053":		{ action: screenshot },

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
