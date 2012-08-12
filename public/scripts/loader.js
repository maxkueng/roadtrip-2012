;(function ($) {

	window.requestAnimFrame = (function(){
		return  window.requestAnimationFrame   || 
			window.webkitRequestAnimationFrame || 
			window.mozRequestAnimationFrame    || 
			window.oRequestAnimationFrame      || 
			window.msRequestAnimationFrame     ||  
			function( callback ){
				window.setTimeout(callback, 1000 / 60);
			};
	})();

	var Vector = function (x, y) {
		this.x = (typeof x !== 'undefined') ? x : 0;
		this.y = (typeof y !== 'undefined') ? y : 0;
	};

	Vector.prototype.add = function (vec) {
		this.x += vec.x;
		this.y += vec.y;
	};

	Vector.prototype.sub = function (vec) {
		this.x -= vec.x;
		this.y -= vec.y;
	};

	Vector.prototype.sub2 = function (vec) {
		return new Vector(
			this.x - vec.x,
			this.y - vec.y
		);
	};

	Vector.prototype.distance = function (vec) {
		var dx, dy;

		dx = this.x - vec.x;
		dy = this.y - vec.y;

		return Math.sqrt(dx * dx + dy * dy);
	};

	Vector.prototype.length = function () {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	};

	Vector.prototype.distanceX = function (vec) {
		return this.x - vec.x;
	};

	Vector.prototype.distanceY = function (vec) {
		return this.y - vec.y;
	};

	Vector.prototype.divide = function (scalar) {
		this.x /= scalar;
		this.y /= scalar;
	};

	Vector.prototype.limit = function (max) {
		var len = this.length();
		if(len > max){
			this.divide(len / max);
		}
	};

	var Color = function (r, g, b, a) {
		this.r = (typeof r !== 'undefined') ? r : 0;
		this.g = (typeof g !== 'undefined') ? g : 0;
		this.b = (typeof b !== 'undefined') ? b : 0;
		this.a = (typeof a !== 'undefined') ? a : 1;
	};

	Color.random = function (a) {
		var r, g, b;
		r = Math.floor(Math.random() * 256);
		g = Math.floor(Math.random() * 256);
		b = Math.floor(Math.random() * 256);

		return new Color(r, g, b, a);
	};

	Color.prototype.toRgbaString = function () {
		return 'rgba(' + Math.round(this.r) + ', ' + Math.round(this.g) + ', ' + Math.round(this.b) + ', ' + this.a + ')';
	};

	var OrbiterParticle = function (system) {
		this.system = system;

		this.position = new Vector();
		this.angle = 0;
		this.orbit = 2;

		this.radius = 3;
		this.color = new Color(239, 255, 0, 0.5);
	};

	OrbiterParticle.prototype.draw = function () {
		this.system.bufferCtx.fillStyle = this.color.toRgbaString();
		this.system.bufferCtx.strokeStyle = new Color(40, 20, 20, 0.5).toRgbaString();
		this.system.bufferCtx.beginPath();
		this.system.bufferCtx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
		this.system.bufferCtx.shadowBlur = 2;
		this.system.bufferCtx.shadowColor = new Color(255, 255, 255, 1).toRgbaString();
		this.system.bufferCtx.stroke();
		this.system.bufferCtx.fill();
	};

	var OrbiterSystem = function (canvas, buffer) {
		this.canvas = canvas;
		this.canvasCtx = canvas.getContext('2d');
		this.canvasCtx.globalCompositeOperation = 'source-over';
		this.buffer = buffer;
		this.bufferCtx = buffer.getContext('2d');
		this.bufferCtx.globalCompositeOperation = 'source-over';
		this.run = true;
		this.particles = [];
		this.particleCount = 3;

		this.backgroundColor = new Color(0, 0, 0, 1);
		this.width = buffer.width;
		this.height = buffer.height;
		this.position = new Vector(this.width / 2, this.height / 2);

		this.createParticles();
	};

	OrbiterSystem.prototype.createParticles = function () {
		var particle;

		for (var i = 0; i < this.particleCount; i++) {
			particle = new OrbiterParticle(this);
			particle.position = this.position;

			particle.orbit = 10;
			particle.speed = 0.1;
			particle.angle =  i % 360;

			this.particles.push(particle);
		}
	};

	OrbiterSystem.prototype.paintCanvas = function () {
//		bufferCtx.fillStyle = this.backgroundColor.toRgbaString();
//		bufferCtx.fillRect(0, 0, this.width, this.height);
		this.bufferCtx.clearRect(0, 0, this.width, this.height);
	};

	OrbiterSystem.prototype.update = function () {
		var particle;
		var x, y;


		for (var i = 0, len = this.particles.length; i < len; i++) {
			particle = this.particles[i];

			particle.angle = (particle.angle + particle.speed) % 360;

			x = Math.sin(i + particle.angle) * (particle.orbit);
			y = Math.cos(i + particle.angle) * (particle.orbit);

			particle.position = new Vector(this.position.x + x, this.position.y + y);
		}

		this.draw();
	};

	OrbiterSystem.prototype.draw = function () {
		var particle;
		this.paintCanvas();

		for (var i = 0, len = this.particles.length; i < len; i++) {
			particle = this.particles[i];
			particle.draw();
		}

		this.canvasCtx.drawImage(this.buffer, 0, 0);
	};

	OrbiterSystem.prototype.start = function () {
		this.run = true;
		this.animate();
	};

	OrbiterSystem.prototype.stop = function () {
		this.run = false;
	};

	OrbiterSystem.prototype.animate = function () {
		var self = this;

		if (this.run === false) { return; }
		this.update();

		window.requestAnimFrame(function () {
			self.animate();
		});
	};

	 

	var methods = {
		init : function () {

			var buffer = document.createElement('canvas');
			var canvas = document.createElement('canvas');
			var width = $(this).width(); 
			var height = $(this).height();

			buffer.width = width;
			buffer.height = height;
			canvas.width = width;
			canvas.height = height;

			$(this).append(canvas);
			$(this)[0].system = new OrbiterSystem(canvas, buffer);
		},

		start : function () { 
			$(this)[0].system.start();
			$(this).show();
		},

		stop : function () {
			$(this)[0].system.stop();
			$(this).hide();
		}
	};

	$.fn.loader = function (method) {

		if ( methods[method] ) {
			return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || !method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
		}    

	};

})( jQuery );
