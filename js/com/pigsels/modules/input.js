PGE.module('pge.input', ['pge.core'], function(module) {
	var core = PGE.pge.core;
	
	var Input = this.Input = core.Class.extend({
		init: function() {
			this.pressedKeys = {};			
			
			this._onKeyDown = core.proxy(this._onKeyDown, this);
			this._onKeyUp = core.proxy(this._onKeyUp, this);
			
			document.addEventListener('keydown', this._onKeyDown, false);
			document.addEventListener('keyup', this._onKeyUp, false);
		},
		_onKeyDown: function(e) {
			this.pressedKeys[e.keyCode] = true;
		},
		_onKeyUp: function(e) {
			delete this.pressedKeys[e.keyCode];
		},
		destroy: function() {			
			document.removeEventListener('keydown', this._onKeyDown, false);
			document.removeEventListener('keyup', this._onKeyDown, false);
		},
		isKeyDown: function(keyCode) {
			return this.pressedKeys[keyCode] === true;
		},
		isLMouseDown: function() {
			
		},
		isRMouseDown: function() {
			
		},
		isMMouseDown: function() {
			
		}
	});
});