PGE = (function() {
	
	var modules = {},
		modulesNumber = 0,
		config = {
			basePath: '.',
			fps: 30,
			width: 800,
			height: 600,
			container: null,
			GameClass: null
		},
		resources = {
			images: {},
			sounds: {}
		};
	
	var namespace = function(path) {
		var parent = _PGE,
			parts = path.split(".");
			
		if (parts[0] === "APP") parts = parts.slice(1);
		var n = parts.length;
		for (var i = 0; i < n; i++) {
			if (parent[parts[i]] === undefined) {
				parent[parts[i]] = {};
			}
			
			parent = parent[parts[i]];
		}
		
		return parent;
	};
	
	var module = function(path, dependencies, init) {
		if (modules[path] !== undefined) return;
		
		modules[path] = {
			module: namespace(path),
			init: init,
			dependencies: dependencies //@todo: linked list dependency implementation
		}
		modulesNumber++;
	};
	
	var setup = function(options) {
		var override = function(config, options) {
			for (var k in options) {
				if (typeof options[k] === 'object' && options.apply !== undefined) {
					config[k] = {};
					override(config[k], options[k]);
				} else {
					config[k] = options[k];
				}
			}
		};
		
		override(config, options);
		
		return PGE;
	};
	
	var preload = function(resourcesConfig, onProgress, onComplete) {
		
		var loadedResources = 0;
		var totalResources = 0;
		
		var queue = [];
		for (var k in resourcesConfig.images) {
			queue.push({
				type: 'image',
				src: config.basePath + resourcesConfig.images[k]
			});
			totalResources++;
		}
		
		// @todo add sounds preloading
		
		var onResourceLoad = function(e) {
			if (onProgress !== undefined) onProgress(++loadedResources, totalResources);
			e.target.removeEventListener('load', onResourceLoad, false);
			if (queue.length) {
				load(queue.shift());
			} else {
				onComplete(totalResources);
			}
		};
		
		var load = function(itemConfig, onComplete) {
			if (itemConfig.type === 'image') {
				var image = resources.images[itemConfig.src] = new Image();
				image.addEventListener('load', onResourceLoad, false);
				image.src = itemConfig.src;
			}
		}
		
		if (queue.length) {
			load(queue.shift());
		} else {
			onComplete(totalResources);
		}
		
		return PGE;
	};
	
	var image = function(src, clone) {
		clone = clone === undefined ? false : clone;
		
		if (!clone) {
			return resources.images[config.basePath + src];
		} else {
			var copy = new Image();
			copy.src = resources.images[config.basePath + src].src;
			return copy;
		}
	}
	
	var startup = function() {
		
		if (config.container === null) throw new Error("Container is not set");
		
		wasChanged = true;
		while (wasChanged) {
			wasChanged = false;
			for (var path in modules) {
				var dependencies = modules[path].dependencies;
				if (dependencies === undefined || dependencies.length === 0) {
					// no dependencies -> safe to init
					//console.log('init ' + path);
					modules[path].init.apply(modules[path].module, [modules[path].module]);
					delete modules[path];
					modulesNumber--;
					wasChanged = true;
					
					// remove this module from dependencies
					// @todo check for duplicates
					for (var innerPath in modules) {
						if (innerPath === path) continue;
						var innerDependencies = modules[innerPath].dependencies;
						var index = innerDependencies.indexOf(path);
						if (index != -1) {
							//console.log('removed dependency from ' + innerPath);
							innerDependencies.splice(index, 1);
						}
					}
				}
			}
		}
		
		if (modulesNumber > 0) {
			var paths = [];
			for (var path in modules) paths.push(path);
			throw new Error("Cycled dependencies: " + paths.join(","));
		}
		
		return PGE;
	};
	
	var run = function(GameClass) {
		
		config.GameClass = GameClass || PGE.pge.game.Game;
		PGE.game = new config.GameClass();
		PGE.game.start();
		
		return PGE;
	};
	
	var _PGE = {
		module: module,
		preload: preload,
		startup: startup,
		setup: setup,
		config: config,
		img: image,
		run: run,
		game: null
	};
	
	return _PGE;
}());
	