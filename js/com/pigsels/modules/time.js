PGE.module('pge.time', ['pge.events'], function(module) {
	var core = PGE.pge.core;
	var proxy = core.proxy;
	
	var EventDispatcher = PGE.pge.events.EventDispatcher;
	var Event = PGE.pge.events.Event;
	
	var Timer = this.Timer = EventDispatcher.extend({
		init: function(delay, loops) {
			this._super();
			this.delay = delay;
			this.loops = loops;
			this.paused = false;
			this.started = false;
		},
		start: function() {
			if (this.started) return;
			this._loopsLeft = this.loops;
			this._timer = setInterval(proxy(this._update, this), this.delay);
			this.started = true;
			this.dispatchEvent(new Event(Timer.TIMER_START));
		},
		stop: function() {
			if (!this.started) return;
			clearInterval(this._timer);
			this.started = false;
			this.dispatchEvent(new Event(Timer.TIMER_STOP));
		},
		pause: function() {
			if (this.paused || this.stopped) return;
			clearInterval(this._timer);
			this.paused = true;
		},
		resume: function() {
			if (!this.paused || this.stopped) return;
			this._timer = setInterval(proxy(this._update, this), this.delay);
			this.paused = false;
		},
		_update: function() {
			if (this._loopsLeft !== -1) {
				this._loopsLeft--;
				if (this._loopsLeft <= 0) this.stop();
			}
			this.dispatchEvent(new Event(Timer.TIMER));
		}
	});
	this.Timer.TIMER_START = 'timer_start';
	this.Timer.TIMER_STOP = 'timer_stop';
	this.Timer.TIMER = 'timer';
	
	var ProcessManager = this.ProcessManager = core.Class.extend({
		init: function(fps) {
			this.fps = fps;
			this.maxTicks = 5;
			this.timeScale = 1;
			this.tickRate = 1000/fps;
			this.timer = new Timer(this.tickRate);
			this.timer.addEventListener(Timer.TIMER, proxy(this.onTimer, this));
			this.ticked = [];
			this.framed = [];
			this.deferred = [];
			this.lastTime = -1;
			this.elapsed = 0;
			this.interpolationFactor = 0;
			
			this.needPurgeEmpty = false;
			this.duringAdvance = false;
		},
		advance: function(deltaTime, unsafe) {
			unsafe = unsafe || false;
			this._platformTime = new Date().getMilliseconds();
			this.elapsed += deltaTime;
			var tickCount = 0, l = this.ticked.length;
			while (this.elapsed >= this.tickRate && (unsafe || tickCount < this.maxTicks)) {
				this.interpolationFactor = 0;
				this.processScheduledObjects();
				this.duringAdvance = true;
				for(var i = 0; i < l; i++) {
					var object = this.ticked[i];
					if (object == undefined) continue;
					object.onTick(this.tickRate);
				}
				this.duringAdvance = false;
				this._virtualTime += this.tickRate;
				this.elapsed -= this.tickRate;
				
				tickCount++;
			}
			
			if (tickCount >= this.maxTicks && !unsafe) {
				console.log("Exceeded maximum number of ticks for frame (" + this.elapsed.toFixed() + "ms dropped) .");
				this.elapsed = 0;
			}
			
			this.elapsed = Math.max(0, Math.min(300, this.elapsed));
			
			this.duringAdvance = true;
			this._interpolationFactor = this.elapsed / this.tickRate;
			l = this.framed.length;
			
			for(i = 0; i < l; i++) {
				var object = this.framed[i];
				if (object == undefined) continue;
				object.onFrame(deltaTime / 1000);
			}
			this.duringAdvance = false;
			
			if (this.needPurgeEmpty) {
				this.needPurgeEmpty = false;
				for (i = ticked.length-1; i >= 0; i--) {
					if (ticked[i] != undefined) continue;
					ticked.splice(i, 1);
				}
				for (i = framed.length-1; i >= 0; i--) {
					if (framed[i] != undefined) continue;
					framed.splice(i, 1);
				}
			}
		},
		processScheduledObjects: function() {
			var prevDeferred = this.deferred;
			if (prevDeferred.length) {
				this.deferred = [];
				var l = prevDeferred.length;
				for (var i = 0; i < l; i++) {
					prevDeferred[i].fn.apply(null, prevDeferred[i].args);
				}
			}
		},
		callLater: function(fn) {
			var args = Array.prototype.slice.apply(arguments, [1]);
			this.deferred.push({
				fn: fn,
				args: args
			});
		},
		registerTicked: function(component) {
			if (this.duringAdvance) {
				this.callLater(proxy(this.registerTicked, this), component);
			} else {
				this.ticked.push(component);
			}
		},
		removeTicked: function(component) {
			delete this.ticked[this.ticked.indexOf(component)];
		},
		registerFramed: function(component) {
			arguments;
			if (this.duringAdvance) {
				this.callLater(proxy(this.registerFramed, this), component);
			} else {
				this.framed.push(component);
			}
		},
		removeFramed: function(component) {
			delete this.framed[this.framed.indexOf(component)];
		},
		onTimer: function() {
			var currentTime = new Date().getMilliseconds();
			if (this.lastTime < 0) {
				this.lastTime = currentTime;
				return;
            }
			var deltaTime = Number(currentTime - this.lastTime)*this.timeScale;
			this.advance(deltaTime);
			
			this.lastTime = currentTime;
		},
		start: function() {
			this._virtualTime = 0;
			this.timer.start();
		},
		stop: function() {
			this.timer.stop();
		},
		pause: function() {
			this.timer.pause();
		},
		resume: function() {
			this.timer.resume();
		}
	});
});