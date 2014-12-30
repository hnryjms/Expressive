var debug = require('debug')('expressive:actions');

var _ = require('underscore');
var Config = require('./config');

var Actions = function(app) {
	this._app = app;
};

Actions.prototype._prepare = function(req, res) {
	var config = Config.database();

	req.parent = this;

	this._req = req;
	this._res = res;

	req.data = this.get('data');
	req.passport = this.get('passport');
	res.locals.config = config;
	res.locals.options = {};
	res.locals.req = req;
	res.locals._expNavMatches = function(active, item) {
		return  active &&
				item &&
				(
					(typeof item == 'string' && active == item) ||
					(item instanceof RegExp && active.match(item))
				);
	}
	res.locals.enqueuedHeader = [];
	if (req.user) {
		res.locals.me = req.user
		
		// TODO: Change admin bar pieces as the users role changes
		res.locals.adminBar = { leftItems: [], rightItems: [] };
		this._generateAdminBar(req.user);
	}
};
Actions.prototype._generateAdminBar = function(user) {
	var app = this;
	app.addMenu({
		title: 'Dashboard',
		active: 'dashboard',
		href: '/admin'
	});
	app.addMenu({
		id: 'content',
		title: 'Content',
		active: /^(posts|pages|media|themes|extensions|settings)/,
		href: '/admin/posts'
	});

	app.addMenu('content', {
		id: 'content-sources'
	});
	app.addMenu('content-sources', {
	   title: 'Posts',
	   active: 'posts',
	   href: '/admin/posts',
	   new: '/admin/posts/new'
	});
	app.addMenu('content-sources', {
		title: 'Pages',
		active: 'pages',
		href: '/admin/pages',
		new: '/admin/pages/new'
	});
	app.addMenu('content-sources', {
		title: 'Media',
		active: 'media',
		href: '/admin/media',
		new: {
			href: '/admin/media/new',
			title: 'Add'
		}
	});

	app.addMenu('content', {
		id: 'content-layout'
	});
	app.addMenu('content-layout', {
		title: 'Themes',
		active: 'themes',
		href: '/admin/themes'
	});
	app.addMenu('content-layout', {
		title: 'Extensions',
		active: 'extensions',
		href: '/admin/extensions'
	});

	app.addMenu('content', {
		id: 'content-options'
	});
	app.addMenu('content-options', {
		title: 'Manage Settings',
		active: 'settings',
		href: '/admin/settings'
	});

	app.addMenu(true, {
		id: 'user',
		title: user.name.display,
		active: /^users/,
		href: '/admin/users/' + user.id
	});
	app.addMenu('user', {
		id: 'accounts'
	});
	if (user.can(user, 'read')) {
		if (user.can(user, 'write')) {
			app.addMenu('accounts', {
				title: 'Edit Profile',
				active: 'users/' + user.id,
				href: '/admin/users/' + user.id
			});
		} else {
			app.addMenu('accounts', {
				title: 'View Profile',
				active: 'users/' + user.id,
				href: '/admin/users/' + user.id
			});
		}
	} 
	if (user.can('users', 'read')) {
		if (user.can('users', 'write')) {
			app.addMenu('accounts', {
				title: 'Accounts',
				active: 'users',
				href: '/admin/users',
				new: '/admin/users/new'
			})
		} else {
			app.addMenu('accounts', {
				title: 'Accounts',
				active: 'users',
				href: '/admin/users'
			});
		}
	}

	app.addMenu('user', {
		id: 'right'
	});

	app.addMenu('user', {
		title: 'Logout',
		href: '/admin/logout'
	});
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
					root.submenu || (root.submenu = []);
					root.submenu.push.apply(root.submenu, items);
				} else if (root.submenu) {
					for (var i2 = 0; i2 < root.submenu.length; i2++) {
						var block = root.submenu[i2];
						if (block.id && block.id == location) {
							block.items || (block.items = []);
							block.items.push.apply(block.items, items);
						}
					};
				}
			};
			for (var i = 0; i < this._res.locals.adminBar.rightItems.length; i++) {
				var root = this._res.locals.adminBar.rightItems[i];
				if (root.id && root.id == location) {
					root.submenu || (root.submenu = []);
					root.submenu.push.apply(root.submenu, items);
				} else if (root.submenu) {
					for (var i2 = 0; i2 < root.submenu.length; i2++) {
						var block = root.submenu[i2];
						if (block.id && block.id == location) {
							block.items || (block.items = []);
							block.items.push.apply(block.items, items);
						}
					};
				}
			};
		}
	}
};
Actions.prototype.customField = function(model, options) {
	var req = this._req;

	if (!req.customFields) {
		req.customFields = {};
	}
	if (!req.customFields[model]) {
		req.customFields[model] = [];
	}
	req.customFields[model].push(options);
};

Actions.prototype.requireUser = function(role) {
	// TODO: Role-based authentication
	return this._req.data.requireUser;
};

Actions.prototype.requireOptions = function() {
	var args = Array.prototype.slice.call(arguments, 0);
	return this._req.data.requireOptions.apply(null, args);
};

Actions.prototype.registerResource = function(name, options) {
	
};

Actions.prototype.enqueueResource = function(name, options) {
	
};

module.exports = Actions;