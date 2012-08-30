PGE.module('pge.display', ['pge.core', 'pge.math'], function(module) {
	var core = PGE.pge.core;
	
	var Matrix22 = PGE.pge.math.Matrix22;
	var Vector2 = PGE.pge.math.Vector2;
	
	this.DisplayObjectContainer = core.Class.extend(core.properties({
		init: function() {
			this._localTransform = new Matrix22();
			this._globalTransform = new Matrix22();
			
			this._x = 0; this._y = 0;
			this._scaleX = 1; this._scaleY = 1;
			this._rotation = 0;
			
			this._parent = null;
			this._children = [];
		},
		_refreshTransform: function() {
			this._localTransform
				.identity()
				.appendScale(this._scaleX, this._scaleY)
				.appendRotation(this._rotation)
				.appendTranslation(this._x, this._y);
			if (this._parent !== null) {
				this._globalTransform = this._parent._globalTransform.append(this._localTransform);
			}			
			for (var i in this._children) this._children[i]._refreshTransform();
		},
		numChildren: function() {
			return this._children.length;
		},
		parent: function() {
			return this._parent;
		},
		addChild: function(child) {
			this._children.push(child);
			child._parent = this;
			child._refreshTransform();
		},
		addChildAt: function(child, index) {
			if (index < 0) throw new Error("Index is out of bounds");
			var l = this._children.length
			for (var i = l; i >= index + 1; i--) {
				this._children[i] = this._children[i] - 1;
			}
			this._children[index] = child;
			child._parent = this;
			child._refreshTransform();
		},
		contains: function(child) {
			return this._children.indexOf(child) !== -1;
		},
		getChildAt: function(index) {
			return this._children[index];
		},
		getChildIndex: function(child) {
			return this._children.indexOf(child);
		},
		removeChild: function(child) {
			var index = this._children.indexOf(child);
			if (index != -1) {
				child._parent = null;
				return this.removeChildAt(index);
			}
		},
		removeChildAt: function(index) {
			var child = this._children[index];
			if (child == undefined) throw new Error("Child is not found");
			this._children[index]._parent = null;
			this._children.splice(index, 1);
			return child;
		},
		setChildIndex: function(child, index) {
			var oldIndex = this._children.indexOf(child);
			var anotherChild = this._children[index];
			this._children[index] = index;
			if (anotherChild !== undefined) {
				this._children[oldIndex] = anotherChild;
			}
		},
		swapChildren: function(child1, child2) {
			this._children[this._children.indexOf(child1)] = child2;
			this._children[this._children.indexOf(child2)] = child1;
		},
		swapChildrenAt: function(index1, index2) {
			var tmp = this._children[index1];
			this._children[index1] = this._children[index2];
			this._children[index2] = tmp;
		},
		draw: function(context) {
			context.save();
			context.transform(
				this._localTransform.m11, // a
				this._localTransform.m21, // b
				this._localTransform.m12, // c
				this._localTransform.m22, // d
				this._localTransform.tx, // e
				this._localTransform.ty  // f
			);
			this._draw(context);
			var l = this._children.length;
			for (var i = 0; i < l; i++) {
				if (this._children[i]) this._children[i].draw(context);
			}
			context.restore();
		},
		_draw: function(context) {
			
		}
	}, ['x','y','scaleX','scaleY','rotation']));
	
	this.Sprite = this.DisplayObjectContainer.extend({
		init: function(image) {
			this.image = image;
			this._super();
		},
		_draw: function(context) {
			context.drawImage(this.image, 0, 0);
		}
	});
	
	this.MovieClip = this.Sprite.extend(core.properties({
		init: function(image, config) {
			this._super(image);
			this.config = config;
			this._frame = 1;
			this._playing = true;
			this._fps = PGE.config.fps;
			this._virtualFrames = 1;
		},
		state: function(value) {
			if (value === undefined) {
				return this._state;
			} else {
				if (value != this._state) {
					this._state= value;
					this._refreshTransform();
					this._frame = 1;
				}
				return this;
			}
		},
		_draw: function(context) {
			var frame = this.config[this._state][this._frame-1];
			context.drawImage(
				this.image, 
				frame[0], frame[1],
				frame[2], frame[3],
				0, 0,
				frame[2], frame[3]
			);
		},
		onFrame: function() {
			if (this._playing) {
				this._virtualFrames++;
				var ratio = this._fps / PGE.config.fps;
				if (this._virtualFrames % ratio <= 0.0001) {
					this._frame++;
				}
			}
			if (this._frame > this.config[this._state].length) this._frame = 1;
		}
	}, ['fps']));
});