PGE.module('pge.game', ['pge.display', 'pge.time', 'pge.input'], function(module) {
	var core = PGE.pge.core;
	var time = PGE.pge.time;
	var display = PGE.pge.display;
	var input = PGE.pge.input;
	
	var Game = this.Game = core.Class.extend({
		init: function() {
			this.process = new time.ProcessManager(PGE.config.fps);
			this.input = new input.Input();
			this.stage = new display.DisplayObjectContainer();
			
			this.container = PGE.config.container;
			this.canvas = document.createElement('canvas');
			this.canvas.setAttribute('width', PGE.config.width);
			this.canvas.setAttribute('height', PGE.config.height);
			this.context = this.canvas.getContext('2d');
			
			this.container.appendChild(this.canvas);
		},
		destroy: function() {
			this.input.destroy();
		},
		start: function() {
			this.process.registerFramed(this);
			this.process.start();
		},
		stop: function() {
			this.process.stop();
		},
		onFrame: function() {
			this.context.fillStyle = '#000000';
			this.context.fillRect(0, 0, PGE.config.width, PGE.config.height);
			this.stage.draw(this.context);
		}
	});
	
	var CustomGame = this.CustomGame = this.Game.extend({
		init: function() {
			this._super();
			this.profiler = new core.Profiler();
			
			var config = {
				walk_down: [ // [x,y,w,h]
					[32,0,32,62], [32*2,0,32,62], [32*3,0,32,62], [32*4,0,32,62]
				],
				walk_up: [
					[32,128,32,64], [32*2,128,32,64], [32*3,128,32,64], [32*4,128,32,64]
				],
				walk_left: [
					[32,62,32,64], [32*2,62,32,64], [32*3,62,32,64], [32*4,62,32,64]
				],
				walk_right: [
					[32,192,32,64], [32*2,192,32,64], [32*3,192,32,64], [32*4,192,32,64]
				],
				stand_down: [
					[0,0,32,62]
				],
				stand_up: [
					[0,128,32,64]
				],
				stand_left: [
					[0,62,32,64]
				],
				stand_right: [
					[0,192,32,64]
				]
			};
			
			this.avatar = new display.MovieClip(PGE.img('images/sprites_map_claudius.png'), config).fps(PGE.config.fps*4);
			this.avatar.state('stand_down').x(0).y(0).scaleX(1.25).scaleY(1.25);
			this.process.registerFramed(this.avatar);
			
			this.clones = [];
			for (var i = 0; i < 200; i++) {
				this.clones[i] = new display.MovieClip(PGE.img('images/sprites_map_claudius.png'), config).fps(PGE.config.fps*2);
				var scale = 0.25 + Math.random()*0.5;
				this.clones[i]
					.state('stand_down')
					.x(Math.random()*(PGE.config.width-32))
					.y(Math.random()*(PGE.config.height-64))
					.scaleX(scale)
					.scaleY(scale);
				this.stage.addChild(this.clones[i]);			
				this.process.registerFramed(this.clones[i]);
				this.clones[i].stateChangeTimer = 0;
			}
			
			this.stage.addChild(this.avatar);			
		},
		onFrame: function() {			
			// move clones
			var states = ['walk_down', 'walk_up', 'walk_right', 'walk_left'];
			for (var i = 0; i < this.clones.length; i++) {
				var clone = this.clones[i];
				if (--clone.stateChangeTimer < 0) {
					clone.stateChangeTimer = Math.round(Math.random()*60);
					clone.state(states[Math.floor(Math.random()*states.length)]);
				}
				
				var state = clone.state();
				if (state == 'walk_left') {
					clone.x(Math.max(0, clone.x()-1/clone.scaleX()));
				} else if (state == 'walk_up') {
					clone.y(Math.max(0, clone.y()-1/clone.scaleX()));
				} else if (state == 'walk_right') {
					clone.x(Math.min(PGE.config.width-32, clone.x()+1/clone.scaleX()));
				} else if (state == 'walk_down') {
					clone.y(Math.min(PGE.config.height-64, clone.y()+1/clone.scaleX()));
				}
			}
			
			// move avatar
			if (this.input.isKeyDown(37)) {
				var x = Math.max(0, this.avatar.x()-2);
				this.avatar.state('walk_left').x(x);
			} else if (this.input.isKeyDown(38)) {
				var y = Math.max(0, this.avatar.y()-2);
				this.avatar.state('walk_up').y(y);
			} else if (this.input.isKeyDown(39)) {
				var x = Math.min(PGE.config.width-32, this.avatar.x()+2);
				this.avatar.state('walk_right').x(x);
			} else if (this.input.isKeyDown(40)) {
				var y = Math.min(PGE.config.height-64, this.avatar.y()+2);
				this.avatar.state('walk_down').y(y);
			} else {
				this.avatar.state(this.avatar.state().replace(/walk/, 'stand'));
			}
			
			// z-sort
			var children = [];
			var total = this.stage.numChildren();
			
			for (var i = 0; i < total; i++) {
				children[i] = this.stage.removeChildAt(0);
			}
			children.sort(function(a, b) {
				if (a.y()+64*a.scaleY() < b.y()+64*b.scaleY()) return -1;
				if (a.y()+64*a.scaleY() > b.y()+64*b.scaleY()) return 1;
				return 0;
			});
			for (var i = 0; i < total; i++) {
				this.stage.addChild(children[i]);
			}			
			this._super();
			
			this.profiler.measure();
			this.context.fillStyle = "Black";
			this.context.fillRect(0,0,150,20);
			this.context.fillStyle = "White";
			this.context.fillText("FPS: Average = " + this.profiler.average(), 0,10);
		}
	});
});