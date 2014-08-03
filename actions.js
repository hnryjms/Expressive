var debug = require('debug')('expressive:actions');

var _ = require('underscore');

var Actions = function(app) {
	this._app = app;
};

Actions.prototype._prepare = function(req, res) {
	req.parent = this;

	this._req = req;
	this._res = res;
};

Actions.prototype.addMenu = function(location, items) {
	if (typeof location == 'object') {
		items = location;
		location = null;
	}

	if (items.constructor !== Array) {
		items = [ items ];
	}

	if (this._res.locals.adminBar) {
		if (!location) {
			this._res.locals.adminBar.leftItems.push.apply(this._res.locals.adminBar.leftItems, items);
		} else if (location === true) {
			this._res.locals.adminBar.rightItems = items.concat(this._res.locals.adminBar.rightItems);
		} else {
			for (var i = 0; i < this._res.locals.adminBar.leftItems.length; i++) {
				var root = this._res.locals.adminBar.leftItems[i];
				if (root.id && root.id == location) {
					root.submenu.push.apply(root.submenu, items);
				} else if (root.submenu) {
					for (var i2 = 0; i2 < root.submenu.length; i2++) {
						var block = root.submenu[i2];
						if (block.id && block.id == location) {
							block.items.push.apply(block.items, items);
						}
					};
				}
			};
			for (var i = 0; i < this._res.locals.adminBar.rightItems.length; i++) {
				var root = this._res.locals.adminBar.rightItems[i];
				if (root.id && root.id == location) {
					root.submenu.push.apply(root.submenu, items);
				} else if (root.submenu) {
					for (var i2 = 0; i2 < root.submenu.length; i2++) {
						var block = root.submenu[i2];
						if (block.id && block.id == location) {
							block.items.push.apply(block.items, items);
						}
					};
				}
			};
		}
	}
};

Actions.prototype.requireUser = function(role) {
	// TODO: Role-based authentication
	return this._req.data.requireUser;
};

Actions.prototype.requireOptions = function() {
	var args = Array.prototype.slice.call(arguments, 0);
	return this._req.data.optionLoader.apply(null, args);
};

Actions.prototype.registerResource = function(name, options) {
	
};

Actions.prototype.enqueueResource = function(name, options) {
	
};

module.exports = Actions;