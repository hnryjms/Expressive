var fs = require('fs');
var path = require('path');
var watch = require('node-watch');
var _ = require('underscore');

var debug = require('debug')('expressive:extend');

var Extend = function(app) {
	var extend = this;

	var initializeExtensions = function(callback) {
		var data = app.get('data');

		if (extend.isReady === false) {
			// Currently preparing... Don't restart initialization
			data.once('_ready', callback);
			return;
		}

		if (!data) {
			if (callback) {
				callback(new Error("Extensions need data object to function."));
			}
			return;
		}

		extend.isReady = false;

		app.set('extensions', {});
		fs.readdir(path.join(__dirname, 'private', 'extensions'), function(err, dirs) {
			var extensions = [];
			var loadExtension = function(extension) {
				debug('Preparing extension "%s"...', extension);

				var EXT = require(extension);

				(function run(mod) {
					// Go over each of the module's children and
					// run over it
					mod.children.forEach(function (child) {
						run(child);
					});

					// Call the specified callback providing the
					// found module
					delete(require.cache[mod.id]);
				})(require.cache[extension]);

				return EXT;
			}
			var next = function(i) {
				if (i >= dirs.length) {
					var index = i - dirs.length;
					if (index >= extensions.length) {
						extend.isReady = true;
						debug('Done preparing extensions');
						data.emit('_ready');
						if (callback) {
							callback();
						}
					} else {
						var extension = path.join(__dirname, 'private', 'extensions', extensions[index]);
						fs.exists(extension, function(exists) {
							if (exists) {

								var EXT = { middleware: loadExtension(extension) };
								
								EXT.name = extensions[index];
								EXT._path = path.join(extension, '../');
								EXT._watcher = watch(path.join(extension, '../'), function(filename) {
									if (filename.substr(-2) == 'js') {
										app.get('extensions')[extensions[index]].middleware = loadExtension(extension);

										debug('Extension "%s" has been updated and reloaded.', extensions[index]);
									}
								});

								app.get('extensions')[extensions[index]] = EXT;
							} else {
								debug('Error with "%s" Extension (missing plugin file)', extensions[index]);
							}
							next(++i);
						});
					}
				} else {
					fs.readFile(path.join(__dirname, 'private', 'extensions', dirs[i], 'package.json'), 'utf8', function(err, json) {
						if (!err) {
							var extension = JSON.parse(json);
							extensions.push(path.join(dirs[i], extension.main || 'app.js'));
							next(++i);
						} else {
							next(++i);
						}
					});
				}
			};
			next(0);
		});
	};
	initializeExtensions();

	this.middleware = function() {
		return function extendMiddleware(req, res, next) {
			(function prepare() {
				if (extend.isReady) {
					req.data.requireOptions('enabled_extensions')(req, res, function(){
						var middleware = Object.keys(app.get('extensions')).reduce(function(a, e) {
							e = app.get('extensions')[e];
							if (e.middleware && _.contains(req.options['enabled_extensions'], e.name)) {
								var fn = e.middleware;
								fn._path = e._path;
								a.push(fn);
							}
							return a;
						}, []);
						var orig = req.app;
						(function pass(i) {
							if (i >= middleware.length) {
								next();
							} else {
								middleware[i](req, res, function(err) {
									req.__proto__ = orig.request;
									res.__proto__ = orig.response;
									if (err) {
										next(err);
									} else {
										pass(++i);
									}
								});
							}
						})(0);
					});
				} else {
					initializeExtensions(prepare);
				}
			})();
		}
	};

	this.errorware = function() {
		return function extendErrorware(error, req, res, next) {
			(function prepare(){
				if (extend.isReady) {
					app.get('data').requireOptions('enabled_extensions')(req, res, function(){
						var middleware = Object.keys(app.get('extensions')).reduce(function(a, e) {
							e = app.get('extensions')[e];
							if (e.middleware && _.contains(req.options['enabled_extensions'], e.name) && e.middleware.length >= 4) {
								var fn = e.middleware;
								fn._path = e._path;
								a.push(fn);
							}
							return a;
						}, []);
						(function pass(i) {
							if (i >= middleware.length) {
								next(error);
							} else {
								middleware[i].parent = app;
								middleware[i].handle(error, req, res, function(err){
									if (err) {
										// Change to new error
										error = err;
									}
									pass(++i);
								});
							}
						})(0);
					});
				} else {
					initializeExtensions(prepare);
				}
			})();
		}
	};
}

module.exports = Extend;
