PGE.module('pge.math', ['pge.core'], function(math) {
	var core = PGE.pge.core;
	
	this.EPSILON = 1e-4;
	
	this.Vector2 = core.Class.extend({
		init: function(x, y, w) {
			this.x = x || 0;
			this.y = y || 0;
			this.w = w===undefined? 1 : w; // default type is point
		},
		length: function() {
			var x = this.x, y = this.y;
			return Math.sqrt(x*x+y*y);
		},
		lengthSquared: function() {
			var x = this.x, y = this.y;
			return x*x+y*y;
		},
		normalize: function() {
			var l = this.length();
			this.x /= l;
			this.y /= l;			
			return this;
		},
		scale: function(s) {
			this.x *= s;
			this.y *= s;
			return this;
		},
		add: function(vector) {
			this.x += vector.x;
			this.y += vector.y;
			return this;
		},
		sub: function(vector) {
			this.x -= vector.x;
			this.y -= vector.y;
			return this;
		},
		dot: function(vector) {
			return this.x*vector.x + this.y*vector.y;
		},
		clone: function() {
			return new math.Vector2(this.x, this.y, this.w);
		},
		rotate: function(angle) {
			var x = this.x,
				y = this.y,
				w = this.w,
				s = Math.sin(angle),
				c = Math.cos(angle);
				
			this.x = x*c - y*s; if (this.x < math.EPSILON) this.x = 0;
			this.y = x*s + y*c; if (this.y < math.EPSILON) this.y = 0;
			
			return this;
		},
		mulM: function(matrix) {
			var x = this.x,
				y = this.y,
				w = this.w;
			this.x = x * matrix.m11 + y * matrix.m12 + w*matrix.tx; 
			this.y = x * matrix.m21 + y * matrix.m22 + w*matrix.ty;
			if (Math.abs(this.x) < math.EPSILON) this.x = 0;
			if (Math.abs(this.y) < math.EPSILON) this.y = 0;
			return this;
		},
		toString: function() {
			return "["+this.x + ", " + this.y + ", " + this.w + "]"
		}
	});
	this.Vector2.distance = function(v1, v2) {
		var dx = (v1.x-v2.x),
			dy = (v1.y-v2.y);
		return Math.sqr(dx*dx+dy*dy);
	}
	this.Vector2.polar = function(length, angle, w) {
		length = length || 1;
		w = w===undefined? 1 : w;
		return new math.Vector2(length*Math.cos(angle), length*Math.sin(angle), w);
	}
	
	this.Matrix22 = core.Class.extend({
		init: function() {
			if (arguments.length === 4) {
				this.m11 = arguments[0] || 1;
				this.m12 = arguments[1] || 0;
				this.m21 = arguments[2] || 0;
				this.m22 = arguments[3] || 1;
				this.tx = 0;
				this.ty = 0;
			} else if (arguments.length === 6) {
				this.m11 = arguments[0] || 1;
				this.m12 = arguments[1] || 0;
				this.tx = arguments[2] || 0;
				this.m21 = arguments[3] || 0;
				this.m22 = arguments[4] || 1;
				this.ty = arguments[5] || 0;
			} else if (arguments.length === 0) {
				this.identity();
			} else {
				throw new Error("Incorrect number of arguments");
			}
		},
		clone: function() {
			return new math.Matrix22(this.m11, this.m12, this.m21, this.m22, this.tx, this.ty);
		},
		identity: function() {
			this.m11 = this.m22 = 1;
			this.m12 = this.m21 = this.tx = this.ty = 0;
			return this;
		},
		zero: function() {
			this.m11 = this.m22 = this.m12 = this.m21 = this.tx = this.ty = 0;
			return this;
		},
		rotation: function(angle) {
			var s = Math.sin(angle),
				c = Math.cos(angle);
			this.m11 = c; this.m12 = -s;
			this.m21 = s; this.m22 = c;
			return this;
		},
		translation: function(tx, ty) {
			this.m11 = this.m22 = this.m12 = this.m21 = 0
			this.tx = tx || 0;
			this.ty = ty || 0;
			return this;
		},
		scale: function(sx, sy) {
			this.m11 = sx || 1;
			this.m22 = sy || 1;
			this.m12 = this.m21 = this.tx = this.ty = 0;
			return this;
		},
		invert: function() {
			var a = this.m11; 
			var b = this.m12; 
			var c = this.m21; 
			var d = this.m22;
			var det = a * d - b * c;
			if (det != 0.0) {
				det = 1.0 / det;
			}
			this.m11 = det * d;
			this.m12 = -det * b;
			this.m21 = -det * c;
			this.m22 =  det * a;
			
			this.tx = - this.tx;
			this.ty = - this.ty;
			return this;
		},
		transpose: function() {
			var tmp = this.m12;
			this.m12 = this.m21;
			this.m21 = tmp;
			return this;
		},
		prepend: function(matrix) {
			var m11 = this.m11, m12 = this.m12, m21 = this.m21, m22 = this.m22, tx = this.tx, ty = this.ty;
			this.m11 = m11*matrix.m11+m12*matrix.m21;
			this.m12 = m11*matrix.m12+m12*matrix.m22;
			this.m21 = m21*matrix.m11+m22*matrix.m21;
			this.m22 = m21*matrix.m21+m22*matrix.m22;
			this.tx = m11*matrix.tx+m12*matrix.ty+tx;
			this.ty = m21*matrix.tx+m22*matrix.ty+ty;
			return this;
		},
		append: function(matrix) {
			var m11 = this.m11, m12 = this.m12, m21 = this.m21, m22 = this.m22, tx = this.tx, ty = this.ty;
			this.m11 = matrix.m11*m11+matrix.m12*m21;
			this.m12 = matrix.m11*m12+matrix.m12*m22;
			this.m21 = matrix.m21*m11+matrix.m22*m21;
			this.m22 = matrix.m21*m21+matrix.m22*m22;
			this.tx = matrix.m11*tx+matrix.m12*ty+matrix.tx;
			this.ty = matrix.m21*tx+matrix.m22*ty+matrix.ty;
			return this;
		},
		prependRotation: function(angle) {
			angle = angle || 0;
			var s = Math.sin(angle),
				c = Math.cos(angle);
			if (Math.abs(s) < math.EPSILON) s = 0;
			if (Math.abs(c) < math.EPSILON) c = 0;
			return this.prepend({
				m11: c, m12: -s, tx: 0,
				m21: s, m22: c,  ty: 0
			});
		},
		appendRotation: function(angle) {
			angle = angle || 0;
			var s = Math.sin(angle),
				c = Math.cos(angle);
			if (Math.abs(s) < math.EPSILON) s = 0;
			if (Math.abs(c) < math.EPSILON) c = 0;
			return this.append({
				m11: c, m12: -s, tx: 0,
				m21: s, m22: c,  ty: 0
			});
		},
		prependScale: function(sx, sy) {
			sx = sx || 1; sy = sy || 1;
			return this.prepend({
				m11: sx, m12: 0, tx: 0,
				m21: 0, m22: sy, ty: 0
			});
		},
		appendScale: function(sx, sy) {
			sx = sx || 1; sy = sy || 1;
			return this.append({
				m11: sx, m12: 0, tx: 0,
				m21: 0, m22: sy, ty: 0
			});
		},
		prependTranslation: function(tx, ty) {
			tx = tx || 0; ty = ty || 0;
			return this.prepend({
				m11: 1, m12: 0, tx: tx,
				m21: 0, m22: 1, ty: ty
			});
		},
		appendTranslation: function(tx, ty) {
			tx = tx || 0; ty = ty || 0;
			return this.append({
				m11: 1, m12: 0, tx: tx,
				m21: 0, m22: 1, ty: ty
			});
		},
		mulV: function(vector) {
			var vx = vector.x, vy = vector.y;
			vector.x = vx * this.m11 + vy * this.m12 + vector.w*this.tx;
			vector.y = vx * this.m21 + vy * this.m22 + vector.w*this.ty;
			return vector;
		},
		toString: function() {
			return this.m11 + " " + this.m12 + " " + this.tx + "\n" + this.m21 + " " + this.m22 + " " + this.ty;
		}
	});
});