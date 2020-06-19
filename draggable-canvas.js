function resizeBBox(bbox, scale) {
		var xc = bbox.xcenter, yc = bbox.ycenter, w = bbox.width, h = bbox.height;
		return {"xcenter": xc, "ycenter": yc, "width": scale * w, "height": scale * h,
						"x1": xc - scale * w / 2, "x2": xc + scale * w / 2,
						"y1": yc - scale * h / 2, "y2": yc + scale * h / 2}
}
function moveBBox(bbox, dx, dy) {
		return resizeBBox({"xcenter": bbox.xcenter + dx, "ycenter": bbox.ycenter + dy, "width": bbox.width, "height": bbox.height}, 1);
}

function DraggableCanvas(node) {
		this.node = node;
		this.ctx = node.getContext("2d");
		this.width = node.width;
		this.height = node.height;
		this.parentWidth = 0;
		this.parentHeight = 0;
		this.xmin = 0;
		this.xmax = 0;
		this.ymin = 0;
		this.ymax = 0;

		this.getParentDimensions = function() {
				var p = this.node.parentElement;
				var cs = window.getComputedStyle(p);
				this.parentWidth = 1 * cs.width.slice(0, -2);
				this.parentHeight = 1 * cs.height.slice(0, -2);
		}
		this.setParentDimensions = function(width, height) {
				var p = this.node.parentElement;
				p.style.width = width;
				p.style.height = height;
		}
		this.center = function() {
				var p = this.node.parentElement;
				this.node.parentElement.scrollTo(p.scrollWidth / 2 - this.parentWidth / 2,
																				 p.scrollHeight / 2 - this.parentHeight / 2);
		}
		this.clear = function() {
				var t = this.ctx.getTransform();
				this.ctx.resetTransform();
				this.ctx.clearRect(-10, -10, this.width + 20, this.height + 20);
				this.ctx.setTransform(t);
		}
		this.resizeHandler = function() {
				this.node.style.display = "none";
				this.setParentDimensions("", "");
				this.getParentDimensions();
				this.setParentDimensions(`${this.parentWidth}px`, `${this.parentHeight}px`);
				this.node.style.display = "block";
				if (this.redrawHandler != null) {
						this.clear();
						this.redrawHandler();
				}
		}
		this.register = function(centerRelX=0.5, centerRelY=0.5) {
				this.node.addEventListener('resize', this.resizeHandler.bind(this));
				this.resizeHandler();
				this.center();  // center the scrolling position
				this.ctx.translate(this.width * centerRelX, this.height * centerRelY); // center (0, 0)
		}

		// this.onScreenWidth = function(inner) {
		// 		var cstyle = window.getComputedStyle(this.node);
		// 		var width = cstyle.width.slice(0, -2);
		// 		if (!inner) return width;
		// 		width = width
		// 				- (cstyle.paddingLeft.slice(0, -2) | 0)
		// 				- (cstyle.paddingRight.slice(0, -2) | 0)
		// 				- (cstyle.borderLeftWidth.slice(0, -2) | 0)
		// 				- (cstyle.borderRightWidth.slice(0, -2) | 0); // px
		// 		return width;
		// }
		// this.onScreenHeight = function(inner) {
		// 		var cstyle = window.getComputedStyle(this.node);
		// 		var height = cstyle.height.slice(0, -2);
		// 		if (!inner) return height;
		// 		height = height
		// 				- (cstyle.paddingTop.slice(0, -2) | 0)
		// 				- (cstyle.paddingBottom.slice(0, -2) | 0)
		// 				- (cstyle.borderTopWidth.slice(0, -2) | 0)
		// 				- (cstyle.borderBottomWidth.slice(0, -2) | 0); // px
		// 		return height;
		// }
		this.updateBoundingBox = function(x, y) {
				this.xmin = Math.min(x, this.xmin);
				this.xmax = Math.max(x, this.xmax);
				this.ymin = Math.min(y, this.ymin);
				this.ymax = Math.max(y, this.ymax);
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
		this.drawLine = function(x1, y1, x2, y2, strokeStyle="black", lineWidth=1) {
				this.ctx.beginPath();
				this.ctx.moveTo(x1, y1);
				this.ctx.strokeStyle = strokeStyle;
				this.ctx.lineWidth = lineWidth;
				this.ctx.lineTo(x2, y2);
				this.ctx.stroke();
				this.updateBoundingBox(x1, y1);
				this.updateBoundingBox(x2, y2);
		}
		this.getScaleFactor = function(bWidth, bHeight) {
				// return Math.min(this.onScreenWidth(true) / bWidth, this.onScreenHeight(true) / bHeight)  // px / unit
				return Math.min(this.width / bWidth, this.height / bHeight)  // px / unit
		}
		this.setView = function(bbox, clear=true, scale=1) {
				// setView must be called *before* drawing stuff!
				if (typeof(bbox) == "number") {
						bbox = this.boundingBox(bbox); // scale
				}
				this.clear();
				var bb = this.currentBBox = resizeBBox(bbox, scale);
				var s = this.currentScaleFactor = this.getScaleFactor(bb.width, bb.height);
				console.debug(bb);
				// this.ctx.setTransform(s, 0, 0, s,
				// 											-bb.xcenter * s + this.onScreenWidth(true) / 2,
				// 											-bb.ycenter * s + this.onScreenHeight(true) / 2);
				this.ctx.setTransform(s, 0, 0, s,
															-bb.xcenter * s + this.width / 2,
															-bb.ycenter * s + this.height / 2);
		}
}
