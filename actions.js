var debug = require('debug')('expressive:actions');

var _ = require('underscore');
var Config = require('./config');

var ExtendObject = function(app, Object) {
	Object._generateAdminBar = function(user) {
		var req = this;
		req.addMenu({
			title: 'Dashboard',
			active: 'dashboard',
			href: '/admin'
		});
		req.addMenu({
			id: 'content',
			title: 'Content',
			active: /^(posts|pages|media|themes|extensions|settings)/,
			href: '/admin/posts'
		});

		req.addMenu('content', {
			id: 'content-sources'
		});
		req.addMenu('content-sources', {
		   title: 'Posts',
		   active: 'posts',
		   href: '/admin/posts',
		   new: '/admin/posts/new'
		});
		req.addMenu('content-sources', {
			title: 'Pages',
			active: 'pages',
			href: '/admin/pages',
			new: '/admin/pages/new'
		});
		req.addMenu('content-sources', {
			title: 'Media',
			active: 'media',
			href: '/admin/media',
			new: {
				href: '/admin/media/new',
				title: 'Add'
			}
		});

		req.addMenu('content', {
			id: 'content-layout'
		});
		req.addMenu('content-layout', {
			title: 'Themes',
			active: 'themes',
			href: '/admin/themes'
		});
		req.addMenu('content-layout', {
			title: 'Extensions',
			active: 'extensions',
			href: '/admin/extensions'
		});

		req.addMenu('content', {
			id: 'content-options'
		});
		req.addMenu('content-options', {
			title: 'Manage Settings',
			active: 'settings',
			href: '/admin/settings'
		});

		req.addMenu(true, {
			id: 'user',
			title: user.name.display,
			active: /^users/,
			href: '/admin/users/' + user.id
		});
		req.addMenu('user', {
			id: 'accounts'
		});
		if (user.can(user, 'read')) {
			if (user.can(user, 'write')) {
				req.addMenu('accounts', {
					id: 'edit-profile',
					title: 'Edit Profile',
					active: 'users/' + user.id,
					href: '/admin/users/' + user.id
				});
			} else {
				req.addMenu('accounts', {
					id: 'view-profile',
					title: 'View Profile',
					active: 'users/' + user.id,
					href: '/admin/users/' + user.id
				});
			}
		} 
		if (user.can('users', 'read')) {
			if (user.can('users', 'write')) {
				req.addMenu('accounts', {
					title: 'Accounts',
					active: 'users',
					href: '/admin/users',
					new: '/admin/users/new'
				})
			} else {
				req.addMenu('accounts', {
					title: 'Accounts',
					active: 'users',
					href: '/admin/users'
				});
			}
		}

		req.addMenu('user', {
			id: 'right'
		});

		req.addMenu('user', {
			title: 'Logout',
			href: '/admin/logout'
		});
	};

	Object.addMenu = function(location, items) {
		if (typeof location == 'object') {
			items = location;
			location = null;
		}

		if (items.constructor !== Array) {
			items = [ items ];
		}

		var req = this;
		var res = this.res || (this.res = {});

		res.locals || (res.locals = {});
		res.locals.adminBar || (res.locals.adminBar = {});

		if (!location) {
			res.locals.adminBar.leftItems || (res.locals.adminBar.leftItems = []);

			res.locals.adminBar.leftItems.push.apply(res.locals.adminBar.leftItems, items);
		} else if (location === true) {
			res.locals.adminBar.rightItems || (res.locals.adminBar.rightItems = []);

			res.locals.adminBar.rightItems = items.concat(res.locals.adminBar.rightItems);
		} else {
			res.locals.adminBar.leftItems || (res.locals.adminBar.leftItems = []);
			res.locals.adminBar.rightItems || (res.locals.adminBar.rightItems = []);

			var hunt = function(menuSide) {
				for (var i = 0; i < menuSide.length; i++) {
					var root = menuSide[i];
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

			hunt(res.locals.adminBar.leftItems);
			hunt(res.locals.adminBar.rightItems);
		}
	};
	Object.customField = function(model, options) {
		var req = this;
		var res = this.res;

		req.customFields || (req.customFields = {});
		req.customFields[model] || (req.customFields[model] = []);

		req.customFields[model].push(options);
	};

	Object.requireUser = function(role) {
		var req = this;
		var res = this.res;

		// TODO: Role-based authentication
		return req.data.requireUser;
	};

	Object.requireOptions = function() {
		var req = this;
		var res = this.res;

		var args = Array.prototype.slice.call(arguments, 0);
		return req.data.requireOptions.apply(null, args);
	};
}

module.exports = ExtendObject;
