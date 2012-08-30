PGE.module('pge.core', [], function(module) {
	var core = this;
	// Simple inheritance utility function
	var Class = this.Class = (function(){
		var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
		var Class = function(){};
		Class.extend = function(prop) {
			var _super = this.prototype;
			
			initializing = true;
			var prototype = new this();
			initializing = false;

			for (var name in prop) {
				prototype[name] = typeof prop[name] == "function" && 
				typeof _super[name] == "function" && fnTest.test(prop[name]) ?
				(function(name, fn){
					return function() {
						var tmp = this._super;
						this._super = _super[name];
						var ret = fn.apply(this, arguments);        
						this._super = tmp;

						return ret;
					};
				})(name, prop[name]) : prop[name];
			}

			Class = function() {
				if ( !initializing && this.init ) this.init.apply(this, arguments);
			}

			Class.prototype = prototype;
			Class.prototype.constructor = Class;
			Class.extend = arguments.callee;

			return Class;
		};
		
		return Class;
	})();
	
	var Profiler = this.Profiler = this.Class.extend({
		init: function() {
			this._fpsSamplesNumber = 20;
			this._fpsSamples = [];
			this._lastTime = new Date().getMilliseconds();
			this._fpsPeak = 0;
			this._fpsAverage = 0;
		},
		measure: function() {
			var currentTime = new Date().getMilliseconds();
			
			var currentFPS = 1000/(currentTime - this._lastTime);
			this._fpsSamples.push(currentFPS);
			if (this._fpsSamples.length > this._fpsSamplesNumber) this._fpsSamples.shift();
			
			if (currentFPS < this._fpsPeak) this._fpsPeak = currentFPS;
			var l = this._fpsSamples.length, s = 0;
			for (var i = 0; i < l; i++) s += this._fpsSamples[i];
			this._fpsAverage = s/l;
			
			this._lastTime = currentTime;
		},
		peak: function() {
			return Math.round(this._fpsPeak*10)/10;
		},
		average: function() {
			return Math.round(this._fpsAverage*10)/10;
		}
	});
	
	var proxy = this.proxy = function(fn, context) {
		return function() {
			var proxiedArgs = Array.prototype.slice.apply(arguments);
			fn.apply(context, proxiedArgs);
		}
	}
	
	var properties = this.properties = function(definition, properties) {
		for (var i in properties) {
			definition[properties[i]] = (function(prop) {
				var privateName = "_" + prop;
				return function(value) {
					if (value === undefined) {
						return this[privateName];
					} else {
						if (value !== this[privateName]){
							this[privateName] = value;
							this._refreshTransform();
						}
						return this;
					}
				};
			}(properties[i]))
		}
		return definition;
	};
});