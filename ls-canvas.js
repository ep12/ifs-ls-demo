function resizeBBox(bbox, scale) {
		var xc = bbox.xcenter, yc = bbox.ycenter, w = bbox.width, h = bbox.height;
		return {"xcenter": xc, "ycenter": yc, "width": scale * w, "height": scale * h,
						"x1": xc - scale * w / 2, "x2": xc + scale * w / 2,
						"y1": yc - scale * h / 2, "y2": yc + scale * h / 2}
}
function moveBBox(bbox, dx, dy) {
		return resizeBBox({"xcenter": bbox.xcenter + dx, "ycenter": bbox.ycenter + dy, "width": bbox.width, "height": bbox.height}, 1);
}

function CanvasWrapper(id, targetWidth = null, targetHeight = null) {
		this.id = id
		this.canvas = document.getElementById(id);
		this.ctx = this.canvas.getContext("2d");
		this.xmin = 0;
		this.xmax = 0;
		this.ymin = 0;
		this.ymax = 0;
		this.targetWidth = targetWidth;
		this.targetHeight = targetHeight;
		this.redrawHandler = null;

		this.currentBBox = null;
		this.currentScaleFactor = 1;
		this.dragStartX = null;
		this.dragStartY = null;
		this.dragStartBBox = null;

		this.dragStartHandler = function(event) {
				this.dragStartX = event.x;
				this.dragStartY = event.y;
				this.dragStartBBox = this.currentBBox;
				console.log(event.x, event.y);
		}
		this.dragHandler = function(event) {
				if (this.dragStartBBox == null) return;
				// console.log(event.x, event.y);
				this.setView(moveBBox(this.dragStartBBox,
															(-event.x + this.dragStartX) / this.currentScaleFactor,
															(-event.y + this.dragStartY) / this.currentScaleFactor));
				if (this.redrawHandler != null) {
						this.clear();
						this.redrawHandler();
				}
		}
		this.dragEndHandler = function(event) {
				this.setView(moveBBox(this.dragStartBBox,
															(-event.x + this.dragStartX) / this.currentScaleFactor,
															(-event.y + this.dragStartY) / this.currentScaleFactor));
				if (this.redrawHandler != null) {
						this.clear();
						this.redrawHandler();
				}
				console.log(event.x, event.y, this.redrawHandler);
				this.dragStartX = null;
				this.dragStartY = null;
				this.dragStartBBox = null;
		}

		this.canvas.addEventListener("mousedown", this.dragStartHandler.bind(this));
		this.canvas.addEventListener("mousemove", this.dragHandler.bind(this));
		this.canvas.addEventListener("mouseup", this.dragEndHandler.bind(this));

		this.onScreenWidth = function(inner) {
				var cstyle = window.getComputedStyle(this.canvas);
				var width = cstyle.width.slice(0, -2);
				if (!inner) return width;
				width = width
						- (cstyle.paddingLeft.slice(0, -2) | 0)
						- (cstyle.paddingRight.slice(0, -2) | 0)
						- (cstyle.borderLeftWidth.slice(0, -2) | 0)
						- (cstyle.borderRightWidth.slice(0, -2) | 0); // px
				return width;
		}
		this.onScreenHeight = function(inner) {
				var cstyle = window.getComputedStyle(canvas);
				var height = cstyle.height.slice(0, -2);
				if (!inner) return height;
				height = height
						- (cstyle.paddingTop.slice(0, -2) | 0)
						- (cstyle.paddingBottom.slice(0, -2) | 0)
						- (cstyle.borderTopWidth.slice(0, -2) | 0)
						- (cstyle.borderBottomWidth.slice(0, -2) | 0); // px
				return height;
		}
		this.resizeCanvas = function() {
				this.canvas.width = this.targetWidth == null ? this.onScreenWidth(true) : this.targetWidth * window.innerWidth;
				this.canvas.height = this.targetHeight == null ? this.onScreenHeight(true) : this.targetHeight * window.innerHeight;
				if (this.redrawHandler != null) this.redrawHandler();
		}
		this.boundingBox = function(scale=1) {
				var xc = (this.xmax + this.xmin) / 2, w = this.xmax - this.xmin;
				var yc = (this.ymax + this.ymin) / 2, h = this.ymax - this.ymin;
				return resizeBBox({"xcenter": xc, "ycenter": yc, "width": w, "height": h}, scale);
		}
		this.drawBBox = function(bbox) {
				var bb = resizeBBox(bbox, 1);
				this.ctx.strokeRect(bb.x1, bb.y1, bb.width, bb.height);
		}
		this.clear = function(scale=2) {
				var bbox = (this.currentBBox != null) ? resizeBBox(this.currentBBox, scale) : this.boundingBox(scale);
				this.ctx.clearRect(bbox.x1, bbox.y1, bbox.width, bbox.height);
		}
		this.updateBoundingBox = function(x, y) {
				this.xmin = Math.min(x, this.xmin);
				this.xmax = Math.max(x, this.xmax);
				this.ymin = Math.min(y, this.ymin);
				this.ymax = Math.max(y, this.ymax);
		}

		this.drawLine = function(x1, y1, x2, y2, strokeStyle="black", lineWidth=1) {
				this.ctx.moveTo(x1, y1);
				this.ctx.strokeStyle = strokeStyle;
				this.ctx.lineWidth = lineWidth;
				this.ctx.lineTo(x2, y2);
				this.ctx.stroke();
				this.updateBoundingBox(x1, y1);
				this.updateBoundingBox(x2, y2);
		}

		this.getScaleFactor = function(bWidth, bHeight) {
				return Math.min(this.onScreenWidth(true) / bWidth, this.onScreenHeight(true) / bHeight)  // px / unit
		}

		this.setView = function(bbox, clear=true, scale=1) {
				// setView must be called *before* drawing stuff!
				if (typeof(bbox) == "number") {
						bbox = this.boundingBox(bbox); // scale
				}
				// TODO: clear
				this.clear();
				var bb = this.currentBBox = resizeBBox(bbox, scale);
				var s = this.currentScaleFactor = this.getScaleFactor(bb.width, bb.height);
				console.debug(bb);
				this.ctx.setTransform(s, 0, 0, s, -bb.xcenter * s + this.onScreenWidth(true) / 2, -bb.ycenter * s + this.onScreenHeight(true) / 2);
		}
}

var c = new CanvasWrapper("canvas", null, 0.5);
var xc = 0, yc = 00, w=100, h=100;
c.resizeCanvas();
c.setView({"xcenter": xc, "ycenter": yc, "width": w, "height": h})
c.redrawHandler = function(){
		// c.drawLine(xc-1, yc-1, xc+1, yc+1, "red");
		// c.drawLine(xc-101, yc+99, xc-99, yc+101, "green");
		c.ctx.strokeRect(xc-w/2, yc-h/2, w, h);
		c.ctx.strokeRect(xc-10, yc-10, 20, 20);
}

window.addEventListener('resize', c.resizeCanvas.bind(c));

// https://stackoverflow.com/a/57943152
// Courtesy of Hypersoft-Systems: U.-S.-A.
function scopeEval(scope, script) {
		return Function('"use strict";return (' + script + ')').bind(scope)();
}

function Turtle(canvas, grammar, phiDeg = 0, iteration = null) {
		this.canvas = canvas;
		this.grammar = grammar;
		this.phi0 = phiDeg * Math.PI / 180;
		this.x = 0;
		this.y = 0;
		this.phi = phiDeg * Math.PI / 180;
		this.xmin = 0;
		this.xmax = 0;
		this.ymin = 0;
		this.ymax = 0;
		this.iteration = iteration;
		this.color = "black";
		this.lineWidth = 1;
		this.dryRun = true;

		this.reset = function() {
				this.x = 0; this.y = 0; this.phi = this.phi0;
				this.xmin = 0; this.xmax = 0; this.ymin = 0; this.ymax = 0;
				this.color = "black"; this.dryRun = true; this.lineWidth = 1;
		}
		this.state = function() {
				return {"x": this.x, "y": this.x, "phi": this.phi, "color": this.color, "lineWidth": this.lineWidth};
		}

		this.getXDest = function(length) {return this.x + length * Math.cos(this.phi)};
		this.getYDest = function(length) {return this.y + length * Math.sin(this.phi)};

		this.boundingBox = function(scale=1) {
				var xc = (this.xmax + this.xmin) / 2, w = this.xmax - this.xmin;
				var yc = (this.ymax + this.ymin) / 2, h = this.ymax - this.ymin;
				return {"xcenter": xc, "ycenter": yc, "width": scale * w, "height": scale * h,
								"x1": xc - scale * w / 2, "x2": xc + scale * w / 2,
								"y1": yc - scale * h / 2, "y2": yc + scale * h / 2}
		}
		this.updateBoundingBox = function(x, y) {
				this.xmin = Math.min(x, this.xmin);
				this.xmax = Math.max(x, this.xmax);
				this.ymin = Math.min(y, this.ymin);
				this.ymax = Math.max(y, this.ymax);
		}
		this.updatePosition = function(x, y) {
				if (this.dryRun) this.updateBoundingBox(x, y);
				this.x = x; this.y = y;
		}
		this.error = function(msg) {
				console.error(msg);
				alert(msg);
		}

		this.draw_forward = function(l) {
				var length = scopeEval(this, l);
				var nx = this.getXDest(length);
				var ny = this.getYDest(length);
				if (!this.dryRun) this.canvas.drawLine(this.x, this.y, nx, ny, this.color, this.lineWidth);
				this.updatePosition(nx, ny);
		}
		this.jump_forward = function(l) {
				var length = scopeEval(this, l);
				var nx = this.getXDest(length);
				var ny = this.getYDest(length);
				this.updatePosition(nx, ny);
		}
		this.turn_left = function(par) {
				var angDeg = scopeEval(this, par);
				this.phi = this.phi - angDeg * Math.PI / 180;
		}
		this.turn_right = function(par) {
				var angDeg = scopeEval(this, par);
				this.phi = this.phi + angDeg * Math.PI / 180;
		}

		this.runStep = function(instruction, par, macroLetter, macroLetterIndex) {
				if (!this.hasOwnProperty(instruction)) {
						this.error(`Turtle does not know what you mean with "${instruction}" (macro "${macroLetter}", instruction ${macroLetterIndex+1})`);
						return 1;
				}
				this[instruction].bind(this)(par); // JS :P
				// console.debug(this.state());
				return 0;
		}
		this.runMacro = function(macroLetter) {
				if (!this.grammar.hasOwnProperty(macroLetter)) {
						this.error(`Turtle does not know the macro "${macroLetter}"`);
						return 1;
				}
				var actions = this.grammar[macroLetter];
				for (var ai=0; ai < actions.length; ai++) {
						var actionspec = actions[ai];
						var instruction = actionspec[0];
						var parameter = actionspec[1];
						var res = this.runStep(instruction, parameter, macroLetter, ai);
						if (res > 0) return res;
				}
				return 0;
		}
		this.run = function(word) {
				for (var i=0; i < word.length; i++) {
						l = word[i];
						var res = this.runMacro(l);
						if (res > 0) {
								alert("Errors occurred and therefore the execution was stopped.");
								return 1;
						}
				}
				return 0;
		}
		this.animate = function(word) {
				if (word.length == 0) return;
				l = word[0];
				var res = this.runMacro(l);
				if (res > 0) {
						alert("Errors occurred and therefore the execution was stopped.");
						return 1;
				}
				var f = function () {
						this.animate(word.slice(1))
				};
				requestAnimationFrame(f.bind(this));
		}

		this.doTheJob = function(word, animate=true) {
				this.reset();
				this.run(word);
				var bb = this.boundingBox();
				this.canvas.setView(bb, true, 1.1);
				// this.canvas.drawBBox(bb);
				this.reset();
				this.dryRun = false;
				(animate ? this.animate : this.run).bind(this)(word);
				this.canvas.redrawHandler = this.redrawHandler(word).bind(this);
		}
		this.redrawHandler = function(word) {
				return function(){console.info("Redrawing!"); this.run(word)};
		}
}
var turtle = new Turtle(c, {"F": [["draw_forward", "100"]], "L": [["turn_left", "60"]], "R": [["turn_right", "60"]]}, 0, 0);
// turtle.doTheJob("FLFRRFLF");
// turtle.run("FLFRRFLF");
// var bb = turtle.boundingBox()
// c.setView(bb, false, 1.2);
// c.ctx.strokeRect(bb.xcenter - bb.width/2, bb.ycenter - bb.height/2, bb.width, bb.height);
// turtle.reset();
// console.error(turtle.state());
// turtle.dryRun = false;
// console.warn(turtle.state());
// turtle.run("FLFRRFLF");
// console.log(turtle.state());
// console.log(turtle.boundingBox());

function setupCanvas() {
		console.log("Setting up canvas");
}

function updateSettings() {
		console.clear();
		c.resizeCanvas();
		c.clear();
		console.info("Updating settings");
		var grammar = parseGrammar();
		var alphabet = Object.keys(grammar);
		console.info("Grammar:", grammar);
		console.info("Alphabet:", alphabet);
		try {
				var axiom = parseAxiom(alphabet);
				console.info("Axiom:", axiom);
		} catch (e) {
				console.error("updateSettings failed!");
				return;
		}
		var rules = parseReplacementRules(alphabet);
		console.info("Rules:", rules);

		var niterations = 1 * document.getElementById("sn-iterruns").value;
		console.info("Number of iterations:", niterations);
		for (i=0; i<=niterations; i++) {
				console.info(doReplacement(axiom, rules, i).length);
		};
		makeWordlengthTable(axiom, rules, niterations);

		var turtle = new Turtle(c, grammar, 0, 0);
		turtle.iteration = niterations
		turtle.doTheJob(doReplacement(axiom, rules, niterations), false);
		console.log(c.currentBBox);
		// var xmin = finalstate["xmin"], xmax = finalstate["xmax"], ymin = finalstate["ymin"], ymax = finalstate["ymax"];
		// var xc = (xmax + xmin) / 2, xhw = (xmax - xmin) / 2, yc = (ymax + ymin) / 2, yhw = (ymax - ymin) / 2;
		// var canvas = document.getElementById("canvas");
		// var	context = canvas.getContext("2d");
		// context.setTransform(1, 0, 0, 1, xmin, ymin); // TODO: scaling
}
