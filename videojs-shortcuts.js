
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

	//TODO: - small icons instead of select box for tools
	function screenshot(){
		var center = this.centering;
		var el = this.el();
		var video = el.querySelector('video');

		function updateScale(video){
			var rect = video.getBoundingClientRect();
			var scalew = player.snapshot.canvas.width / rect.width;
			var scaleh = player.snapshot.canvas.height / rect.height;
			player.snapshot.ctrl.scale = Math.max(Math.max(scalew, scaleh), 1);
			player.snapshot.ctrl.scale_txt.innerHTML = (Math.round(1/player.snapshot.ctrl.scale*100)/100) +"x";
		}

		if(video){
			if(!this.snapshot){
				this.snapshot = {};
				//TODO: refactor to use videojs components
				this.snapshot.parent = document.createElement('div');
				this.snapshot.parent.id = "canvas_parent";
				this.snapshot.container = document.createElement('div');
				this.snapshot.container.id = "canvas_container";
				this.snapshot.canvas_bg = document.createElement('canvas');
				this.snapshot.container.appendChild(this.snapshot.canvas_bg);
				this.snapshot.ctx_bg = this.snapshot.canvas_bg.getContext("2d");
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
				this.snapshot.textbox = document.createElement('textarea');
				this.snapshot.textbox.style.display = "none";
				this.snapshot.container.appendChild(this.snapshot.textbox);

				var rect = video.getBoundingClientRect(); // use bounding rect instead of player.width/height because of fullscreen
				this.snapshot.canvas.style.maxWidth  = rect.width  +"px";
				this.snapshot.canvas.style.maxHeight = rect.height +"px";
				this.snapshot.canvas_bg.style.maxWidth  = rect.width  +"px";
				this.snapshot.canvas_bg.style.maxHeight = rect.height +"px";
				this.snapshot.parent.style.width = video.videoWidth +"px";
				this.snapshot.parent.style.height = video.videoHeight  +"px";
				this.snapshot.parent.style.maxWidth  = rect.width  +"px";
				this.snapshot.parent.style.maxHeight = rect.height +"px";

				// drawing control bar
				this.snapshot.ctrl = document.createElement('div');
				this.snapshot.ctrl.className = "vjs-control-bar vjs-drawing-ctrl";
				this.snapshot.ctrl.style.display = "none";
				this.snapshot.ctrl.color = document.createElement('input');
				this.snapshot.ctrl.color.className = "vjs-control";
				this.snapshot.ctrl.color.setAttribute('type', 'color');
				this.snapshot.ctrl.color.value = '#df4b26';
				this.snapshot.ctrl.color.title = "color";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.color);
				this.snapshot.ctrl.size = document.createElement('input');
				this.snapshot.ctrl.size.className = "vjs-control";
				this.snapshot.ctrl.size.setAttribute('type', 'number');
				this.snapshot.ctrl.size.value = '10';
				this.snapshot.ctrl.size.title = "line width, text size, ...";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.size);

				this.snapshot.ctrl.tool = 'crop';
				this.snapshot.ctrl.toolbrush = document.createElement('div');
				this.snapshot.ctrl.toolbrush.className = "vjs-control vjs-drawing-brush";
				this.snapshot.ctrl.toolbrush.dataset.value = 'brush';
				this.snapshot.ctrl.toolbrush.title = "freehand drawing";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.toolbrush);
				this.snapshot.ctrl.toolrect = document.createElement('div');
				this.snapshot.ctrl.toolrect.className = "vjs-control vjs-drawing-rect";
				this.snapshot.ctrl.toolrect.dataset.value =  'rectangle';
				this.snapshot.ctrl.toolrect.title = "draw rectangle from top left to bottom right";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.toolrect);
				this.snapshot.ctrl.toolcrop = document.createElement('div');
				this.snapshot.ctrl.toolcrop.dataset.value = 'crop';
				this.snapshot.ctrl.toolcrop.title = "select area and click selection to crop";
				this.snapshot.ctrl.toolcrop.className = "vjs-control vjs-drawing-crop vjs-tool-active";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.toolcrop);
				this.snapshot.ctrl.tooltext = document.createElement('div');
				this.snapshot.ctrl.tooltext.className = "vjs-control vjs-drawing-text";
				this.snapshot.ctrl.tooltext.dataset.value = 'text';
				this.snapshot.ctrl.tooltext.title = "select area, type message and then click somewhere else";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.tooltext);
				this.snapshot.ctrl.tooldel = document.createElement('div');
				this.snapshot.ctrl.tooldel.className = "vjs-control vjs-drawing-del";
				this.snapshot.ctrl.tooldel.dataset.value = 'eraser';
				this.snapshot.ctrl.tooldel.title = "erase drawing in clicked location";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.tooldel);

				this.snapshot.ctrl.dljpeg = document.createElement('button');
				this.snapshot.ctrl.dljpeg.innerHTML = "JPEG";
				this.snapshot.ctrl.dljpeg.title = "open new tab with jpeg image";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.dljpeg);
				this.snapshot.ctrl.dlpng = document.createElement('button');
				this.snapshot.ctrl.dlpng.innerHTML = "PNG";
				this.snapshot.ctrl.dlpng.title = "open new tab with png image";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.dlpng);
				this.snapshot.ctrl.scale_txt = document.createElement('span');
				this.snapshot.ctrl.scale = null;
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.scale_txt);
				this.snapshot.ctrl.close = document.createElement('div');
				this.snapshot.ctrl.close.className = "vjs-control vjs-drawing-close";
				this.snapshot.ctrl.close.title = "close screenshot and return to video";
				this.snapshot.ctrl.appendChild(this.snapshot.ctrl.close);

				el.appendChild(this.snapshot.ctrl);

				var snapshot = this.snapshot;
				snapshot.ctrl.color.addEventListener('change', function(e){
					snapshot.ctx.strokeStyle = snapshot.ctrl.color.value;
				}, false);
				snapshot.ctrl.size.addEventListener('change', function(e){
					snapshot.ctx.lineWidth = snapshot.ctrl.size.value / 2;
				}, false);
				
				function tool_clicked(e){
					var active_tool = snapshot.ctrl.querySelector('.vjs-tool-active');
					active_tool.classList.remove('vjs-tool-active');
					e.target.classList.add('vjs-tool-active');
					snapshot.ctrl.tool = e.target.dataset.value;
				}
				snapshot.ctrl.toolbrush.addEventListener('click', tool_clicked);
				snapshot.ctrl.toolrect.addEventListener('click', tool_clicked);
				snapshot.ctrl.toolcrop.addEventListener('click', tool_clicked);
				snapshot.ctrl.tooltext.addEventListener('click', tool_clicked);
				snapshot.ctrl.tooldel.addEventListener('click', tool_clicked);

				snapshot.ctrl.close.addEventListener('click', function(){
					snapshot.ctrl.style.display = "none";
					center.toggle('snapshot');
					player.controlBar.show();
				}, false);

				snapshot.parent.appendChild(this.snapshot.container);
				center.addDisplay('snapshot', [this.snapshot.parent]);

				function cropCanvas(canvas, context){
					var newcanvas = document.createElement('canvas');
					newcanvas.width = snapshot.ctrl.scale * snapshot.cropbox.offsetWidth;
					newcanvas.height = snapshot.ctrl.scale * snapshot.cropbox.offsetHeight;
					newcanvas.style.maxWidth  = rect.width  +"px";
					newcanvas.style.maxHeight = rect.height +"px";

					var ctx = newcanvas.getContext("2d");
					ctx.drawImage(canvas, snapshot.ctrl.scale*snapshot.cropbox.offsetLeft, snapshot.ctrl.scale*snapshot.cropbox.offsetTop,
									newcanvas.width, newcanvas.height, 0, 0, newcanvas.width, newcanvas.height);

					snapshot.container.replaceChild(newcanvas, canvas);
// 					canvas = newcanvas;
					ctx.lineCap = context.lineCap; // transfer context states
					ctx.strokeStyle = context.strokeStyle;
					ctx.lineWidth = context.lineWidth;
// 					context = ctx;
					// javascript has no pass-by-reference -> do stupid stuff
					return [newcanvas, ctx];
				}
				snapshot.cropbox.addEventListener('mousedown', function(e){
					var r = cropCanvas(snapshot.canvas_bg, snapshot.ctx_bg);
					snapshot.canvas_bg = r[0]; snapshot.ctx_bg = r[1];
					r = cropCanvas(snapshot.canvas, snapshot.ctx);
					snapshot.canvas = r[0]; snapshot.ctx = r[1];
					updateScale(video);

					snapshot.cropbox.style.display = "none";
					e.stopPropagation(); //otherwise canvas below gets mousedown
				}, false);

				snapshot.textbox.addEventListener('keydown', function(e){ // don't fire player shortcuts when textbox has focus
					e.stopPropagation();
				}, false);
				snapshot.textbox.addEventListener('blur', function(e){
					snapshot.ctx.fillStyle = snapshot.ctrl.color.value;
					snapshot.ctx.font = snapshot.ctrl.scale*snapshot.ctrl.size.value +"px sans-serif";
					snapshot.ctx.textBaseline = "top";
					snapshot.ctx.fillText(snapshot.textbox.value,
							snapshot.ctrl.scale*snapshot.textbox.offsetLeft +snapshot.ctrl.scale,
							snapshot.ctrl.scale*snapshot.textbox.offsetTop +snapshot.ctrl.scale); //+1 for border?
					//FIXME: there's still a minor shift when scale isn't 1, in firefox more and also when scale is 1
					snapshot.textbox.style.display = "none";
					snapshot.textbox.value = "";
				}, false);

				var paint = false;
				snapshot.container.addEventListener('mousedown', function(e){
					paint = true;
					var pos = snapshot.container.getBoundingClientRect();
					var x = e.clientX - pos.left;
					var y = e.clientY - pos.top;
					switch(snapshot.ctrl.tool){
						case "brush":
							x *= snapshot.ctrl.scale; y *= snapshot.ctrl.scale;
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

							snapshot.cropbox.style.border = "1px dashed "+ snapshot.ctrl.color.value;
							snapshot.cropbox.style.color = snapshot.ctrl.color.value;
							break;
						case "text":
							// if shown already, loose focus and draw it first, otherwise it gets drawn at mousedown
							if(snapshot.textbox.style.display == "none"){
								snapshot.textbox.style.width = 0;
								snapshot.textbox.style.height = 0;
								snapshot.textbox.style.display = "block";
								snapshot.textbox.style.left = x + "px";
								snapshot.textbox.style.top = y + "px";

								snapshot.textbox.style.border = "1px dashed "+ snapshot.ctrl.color.value;
								snapshot.textbox.style.color = snapshot.ctrl.color.value;
								snapshot.textbox.style.font = snapshot.ctrl.size.value +"px sans-serif";
// 								snapshot.textbox.style.lineHeight = snapshot.ctrl.size.value +"px";
							}
							break;
						case "eraser":
							var s = snapshot.ctrl.size.value;
							snapshot.ctx.clearRect(snapshot.ctrl.scale*x - s/2, snapshot.ctrl.scale*y - s/2, s, s);
							break;
					}
			// 		e.preventDefault();
				}, false);

				snapshot.container.addEventListener('mousemove', function(e){
					if(paint){
						var pos = snapshot.container.getBoundingClientRect();
						var x = e.clientX - pos.left;
						var y = e.clientY - pos.top;
						switch(snapshot.ctrl.tool){
							case "brush":
								snapshot.ctx.lineTo(snapshot.ctrl.scale * x, snapshot.ctrl.scale * y);
								snapshot.ctx.stroke();
								break;
							case "rectangle":
								snapshot.ctx_rect.clearRect(0, 0, snapshot.ctx_rect.canvas.width, snapshot.ctx_rect.canvas.height);
								// this way it's only possible to drag to the right and down, mousedown sets top left
								snapshot.canvas_rect.width = x - snapshot.canvas_rect.offsetLeft; // resize canvas
								snapshot.canvas_rect.height = y - snapshot.canvas_rect.offsetTop;
								snapshot.ctx_rect.strokeStyle = snapshot.ctrl.color.value; //looks like its reset when resizing canvas
								snapshot.ctx_rect.lineWidth = snapshot.ctrl.size.value / snapshot.ctrl.scale; // scale lineWidth
								snapshot.ctx_rect.strokeRect(0, 0, snapshot.ctx_rect.canvas.width, snapshot.ctx_rect.canvas.height);
								break;
							case "crop":
								snapshot.cropbox.style.width = (x - snapshot.cropbox.offsetLeft) +"px"; // resize
								snapshot.cropbox.style.height = (y - snapshot.cropbox.offsetTop) +"px";
								break;
							case "text":
								snapshot.textbox.style.width = (x - snapshot.textbox.offsetLeft) +"px"; // resize
								snapshot.textbox.style.height = (y - snapshot.textbox.offsetTop) +"px";
								break;
							case "eraser":
								var s = snapshot.ctrl.size.value;
								snapshot.ctx.clearRect(snapshot.ctrl.scale*x - s/2, snapshot.ctrl.scale*y - s/2, s, s);
								break;
						}
						e.preventDefault();
					}
				}, false);

				function finish(){
					if(paint){
						paint = false;
						if(snapshot.ctrl.tool == "rectangle"){
							//blit snapshot.canvas_rect on canvas, scaled
							snapshot.ctx.drawImage(snapshot.canvas_rect,
									snapshot.ctrl.scale*snapshot.canvas_rect.offsetLeft, snapshot.ctrl.scale*snapshot.canvas_rect.offsetTop,
									snapshot.ctrl.scale*snapshot.ctx_rect.canvas.width, snapshot.ctrl.scale*snapshot.ctx_rect.canvas.height);
							snapshot.canvas_rect.style.display = "none";
						}else if(snapshot.ctrl.tool == "text"){
							el.blur();
							snapshot.textbox.focus();
						}
					}
				}
				snapshot.container.addEventListener('mouseup', finish, false);
				snapshot.container.addEventListener('mouseleave', finish, false);

				function combineDrawing(encoding){
					var canvas_tmp = document.createElement('canvas');
					canvas_tmp.width = snapshot.canvas.width;
					canvas_tmp.height = snapshot.canvas.height;
					var ctx_tmp = canvas_tmp.getContext("2d");
					ctx_tmp.drawImage(snapshot.canvas_bg, 0, 0);
					ctx_tmp.drawImage(snapshot.canvas, 0, 0);
					window.open(canvas_tmp.toDataURL(encoding));
				}
				snapshot.ctrl.dljpeg.addEventListener('click', function(){
					combineDrawing("image/jpeg");
				}, false);
				snapshot.ctrl.dlpng.addEventListener('click', function(){
					combineDrawing("image/png");
				}, false);
			}

			this.snapshot.canvas.width = video.videoWidth;
			this.snapshot.canvas.height = video.videoHeight;
			this.snapshot.ctx.strokeStyle = this.snapshot.ctrl.color.value;
			this.snapshot.ctx.lineWidth = this.snapshot.ctrl.size.value / 2;
			this.snapshot.ctx.lineCap = "round";
			updateScale(video);

			this.snapshot.canvas_bg.width = video.videoWidth;
			this.snapshot.canvas_bg.height = video.videoHeight;
			this.snapshot.ctx_bg.drawImage(video, 0, 0);

			center.toggle('snapshot');
			this.snapshot.ctrl.style.display = "block";
			player.controlBar.hide();

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
