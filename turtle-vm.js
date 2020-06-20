Math.rand = function(a=0, b=1) {return a + (b - a) * Math.random()};

// adapted from https://stackoverflow.com/a/49434653
Math.randStdNorm = function() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num;
};
Math.randNorm = function(mean, std) {return mean + std * Math.randStdNorm()};


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
		this.savedStates = []; // TODO
		this.finishCallback = null;
		this.dead = false;

		this.reset = function() {
				this.x = 0; this.y = 0; this.phi = this.phi0;
				this.xmin = 0; this.xmax = 0; this.ymin = 0; this.ymax = 0;
				this.color = "black"; this.dryRun = true; this.lineWidth = 1;
				this.dead = false;
		}
		this.state = function() {
				return {"x": this.x, "y": this.y, "phi": this.phi, "color": this.color, "lineWidth": this.lineWidth};
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
		this.checkNumbers = function () {
				return [this.x, this.y, this.phi].every(Number.isFinite);
		}
		// -----------

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
		this.set_direction = function(par) {
				var angDeg = scopeEval(this, par);
				this.phi = -angDeg * Math.PI / 180;
		}
		this.set_position = function(par) {
				var tup = scopeEval(this, par);
				if (typeof(tup) != "object"
						|| !tup.hasOwnProperty("length")
						|| tup.length < 2
						|| !Array.from(tup).every(x => typeof(x) == "number")) {
						this.error(`Cannot set position: ${tup} is not a tuple of two numbers`)
						return 1
				}
				this.x = tup[0];
				this.y = tup[1];
		}
		this.no_operation = function(par) {};
		this.set_color = function(par) {
				this.color = scopeEval(this, par);
		}
		this.set_linewidth = function(par) {
				this.lineWidth = scopeEval(this, par);
		}
		this.save_state = function(par) {
				this.savedStates.push(this.state());
		}
		this.restore_state = function(par) {
				// do sth. with par?
				var s = this.savedStates.pop();
				if (s === undefined) {
						this.error("Could not pop state");
						return 1
				}
				Object.keys(s).forEach(x => this[x] = s[x]);
		}
		this.dump_state = function(par) {
				var s = this.state();
				s["savedStates"] = this.savedStates;
				console.info("dump_state:", JSON.stringify(s));
		}


		// -----------------------------------------------------------------------
		this.kill = function() {
				this.dead = true;
		}
		this.runStep = function(instruction, par, macroLetter, macroLetterIndex) {
				if (!this.hasOwnProperty(instruction)) {
						this.error(`Turtle does not know what you mean with "${instruction}" (macro "${macroLetter}", instruction ${macroLetterIndex+1})`);
						return 1;
				}
				var res = this[instruction].bind(this)(par); // JS :P
				if (!this.checkNumbers()) {
						var s = this.state();
						this.error(`Error: macro "${macroLetter}", instruction ${macroLetterIndex+1} ("${instruction}"), argument ${par}:\nnon-numeric state:\n${s}`);
						return 1;
				}
				return res;
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
						if (res == 1) return res;
				}
				return 0;
		}
		this.run = function(word) {
				for (var i=0; i < word.length; i++) {
						l = word[i];
						var res = this.runMacro(l);
						if (res > 0) {
								alert("Errors occurred and therefore the execution was stopped.");
								if (this.finishCallback != null) this.finishCallback();
								return 1;
						}
				}
				if (this.finishCallback != null && !this.dryRun) this.finishCallback();
				return 0;
		}
		this.animate = function(word) {
				if (word.length == 0) {
						if (this.finishCallback != null && !this.dryRun) this.finishCallback();
						return
				}
				l = word[0];
				var res = this.runMacro(l);
				if (res > 0) {
						alert("Errors occurred and therefore the execution was stopped.");
						if (this.finishCallback != null && !this.dryRun) this.finishCallback();
						return 1;
				}
				var f = function () {
						this.animate(word.slice(1))
				};
				if (!this.dead) {
						requestAnimationFrame(f.bind(this));
				} else {
						console.info("The turtle died");
						this.dead = false;
						if (this.finishCallback != null && !this.dryRun) this.finishCallback();
				}
		}

		this.doTheJob = function(word, animate=true, scale=2, finishCallback=null, button=null) {
				if (button != null) button.value = "calculating...";
				this.reset();
				this.finishCallback = finishCallback;
				this.canvas.clear();
				this.run(word);
				var bb = this.boundingBox();
				this.canvas.setView(bb, true, scale);
				this.canvas.clear();
				// this.canvas.drawBBox(bb);
				this.reset();
				this.dryRun = false;
				if (button != null) button.value = "drawing...";
				(animate ? this.animate : this.run).bind(this)(word);
				this.canvas.redrawHandler = this.redrawHandler(word).bind(this);
		}
		this.redrawHandler = function(word) {
				return function(){console.info("Redrawing!"); this.run(word)};
		}
}
