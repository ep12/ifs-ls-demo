function CollapsiblePane(id, eventType="click", hideHandler=null, showHandler=null) {
		this.id = id;
		this.hideHandler = hideHandler;
		this.showHandler = showHandler;

		this.node = function() {
				return document.getElementById(this.id);
		}
		this.paneHeader = function() {
				return this.node().getElementsByClassName("pane-title")[0];
		}
		this.paneContent = function() {
				return this.node().getElementsByClassName("pane-content")[0];
		}
		this.paneBottom = function() {
				return this.node().getElementsByClassName("pane-bottom")[0];
		}
		this.toggle = function(event) {
				var h = this.paneHeader();
				var c = this.paneContent();
				var b = this.paneBottom();
				if (c.style.display == "none") {
						c.style.display = "block";
						b.style.display = "block";
						h.style.borderRadius = "";
						if (this.showHandler != null) this.showHandler.bind(this)();
				} else {
						c.style.display = "none";
						b.style.display = "none";
						h.style.borderRadius = "1rem";
						if (this.hideHandler != null) this.hideHandler.bind(this)();
				}
		}
		this.isVisible = function() {
				return (this.paneContent().style.display != "none");
		}
		this.paneHeader().addEventListener(eventType, this.toggle.bind(this));
}
