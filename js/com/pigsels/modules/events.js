PGE.module('pge.events', ['pge.core'], function(module) {
	var core = PGE.pge.core;
	
	var EventDispatcher = this.EventDispatcher = core.Class.extend({		
		init: function() {
			this.listeners = {};
		},
		hasEventListener: function(type, listener) {
			return (this.listeners[type] !== undefined) && (this.listeners[type].indexOf(listener) != -1);
		},
		addEventListener: function(type, listener) {
			if (this.hasEventListener(type, listener)) return;
			
			if (this.listeners[type] === undefined) this.listeners[type] = [];
			this.listeners[type].push(listener);
		},
		removeEventListener: function(type, listener) {
			if (!this.hasEventListener(type, listener)) return;
			this.listeners[type].splice(this.listeners[type].indexOf(listener), 1);
		},
		dispatchEvent: function(event) {
			if (this.listeners[event.type] === undefined) return;
			var listeners = this.listeners[event.type];
			var l = listeners.length;
			for (var i = 0; i < l; i++) listeners[i](event);
		}
	});
	
	var Event = this.Event = core.Class.extend({
		init: function(type) {
			this.type = type;
		}
	});
});