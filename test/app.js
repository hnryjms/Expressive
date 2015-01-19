var expect = require('expect.js');

var env = require('./_env');
var app = require('../app');

var data = env.data;

describe('app', function() {
	it('should be a function', function(){
		expect(app).to.be.a(Function);
	});

	describe('actions', function() {
		var InsertActions = require('../actions');

		it('should add functions', function() {
			var req = {};
			InsertActions(app, req);

			expect(req._generateAdminBar).to.be.a(Function);
			expect(req.addMenu).to.be.a(Function);
			expect(req.customField).to.be.a(Function);
			expect(req.requireUser).to.be.a(Function);
			expect(req.requireOptions).to.be.a(Function);
		});

		describe('addMenu()', function() {
			it('should setup left menu', function() {
				var req = {};
				InsertActions(app, req);

				req.addMenu.call(req, {});

				var adminBar = req.res.locals.adminBar;
				expect(adminBar).to.be.a(Object);
				expect(adminBar.leftItems).to.be.an(Array);
				expect(adminBar.leftItems).to.have.length(1);
			});
			it('should setup right menu', function() {
				var req = {};
				InsertActions(app, req);

				req.addMenu.call(req, true, {});

				var adminBar = req.res.locals.adminBar;

				expect(adminBar).to.be.a(Object);
				expect(adminBar.rightItems).to.be.an(Array);
				expect(adminBar.rightItems).to.have.length(1);
			});
			it('should hunt submenu', function() {
				var req = {};
				InsertActions(app, req);

				req.addMenu.call(req, {
					id: 'content'
				});
				req.addMenu.call(req, 'content', {
					id: 'submenu'
				});

				var adminBar = req.res.locals.adminBar;

				expect(adminBar).to.be.a(Object);
				expect(adminBar.leftItems).to.be.an(Array);
				expect(adminBar.leftItems).to.have.length(1);
				expect(adminBar.leftItems[0].submenu).to.be.a(Object);
				expect(adminBar.leftItems[0].submenu).to.have.length(1);
			});
			it('should hunt submenu group', function() {
				var req = {};
				InsertActions(app, req);

				req.addMenu.call(req, {
					id: 'content'
				});
				req.addMenu.call(req, 'content', {
					id: 'content-group'
				});
				req.addMenu.call(req, 'content-group', {
					id: 'submenu'
				});

				var adminBar = req.res.locals.adminBar;

				expect(adminBar).to.be.a(Object);
				expect(adminBar.leftItems).to.be.an(Array);
				expect(adminBar.leftItems).to.have.length(1);
				expect(adminBar.leftItems[0].submenu).to.be.a(Object);
				expect(adminBar.leftItems[0].submenu).to.have.length(1);
				expect(adminBar.leftItems[0].submenu[0].items).to.be.a(Object);
				expect(adminBar.leftItems[0].submenu[0].items).to.have.length(1);
			});
		});
		describe('_generateAdminBar()', function() {
			var fullUser = function() {
				var User = data.model('User');
				var me = new User();
				me.name.first = 'James';
				me.name.last = 'Smith';
				me.email = 'james@yourdomain.com';
				me.password = 'mypassword';
				
				me.can(me, ['read', 'write']);

				return me;
			}

			it('should add basic menu items', function() {
				var user = fullUser();

				var req = {};
				InsertActions(app, req);

				req._generateAdminBar(user);

				var adminBar = req.res.locals.adminBar;
				expect(adminBar.leftItems).to.have.length(2);
				expect(adminBar.leftItems[0].active).to.be.eql('dashboard');

				var content = adminBar.leftItems[1];
				expect(content.id).to.be.eql('content');
				expect(content.submenu).to.have.length(3);
				var contentSources = content.submenu[0];
				expect(contentSources.items).to.have.length(3);
				var contentLayout = content.submenu[1];
				expect(contentLayout.items).to.have.length(2);
				var contentOptions = content.submenu[2];
				expect(contentOptions.items).to.have.length(1);

				var user = adminBar.rightItems[0];
				expect(user.id).to.be.eql('user');
				expect(user.submenu).to.have.length(3);
				var account = user.submenu[0];
				expect(account.items).to.have.length(1);
				expect(account.items[0].id).to.be.eql('edit-profile');
			});
			it('should add extra rights', function() {
				var user = fullUser();

				user.can('users', ['read', 'write']);

				var req = {};
				InsertActions(app, req);

				req._generateAdminBar(user);

				var adminBar = req.res.locals.adminBar;
				var user = adminBar.rightItems[0];
				var account = user.submenu[0];
				expect(account.items).to.have.length(2);
			});
			it('should lock profile', function() {
				var user = fullUser();

				user.can(user, ['read']);

				var req = {};
				InsertActions(app, req);

				req._generateAdminBar(user);

				var adminBar = req.res.locals.adminBar;
				var user = adminBar.rightItems[0];
				var account = user.submenu[0];
				expect(account.items).to.have.length(1);
				expect(account.items[0].id).to.be.eql('view-profile');
			});
			it('should view profile', function() {
				var user = fullUser();

				user.can('users', ['read']);

				var req = {};
				InsertActions(app, req);

				req._generateAdminBar(user);

				var adminBar = req.res.locals.adminBar;
				var user = adminBar.rightItems[0];
				var account = user.submenu[0];
				expect(account.items).to.have.length(2);
				expect(account.items[1].new).to.not.be.ok();
			});
		});
		describe('customField()', function() {
			it('should add model', function() {
				var req = {};
				InsertActions(app, req);

				req.customField.call(req, 'User', {
					name: 'sample'
				});

				expect(req.customFields).to.be.a(Object);
				expect(req.customFields['User']).to.be.an(Array);
				expect(req.customFields['User']).to.have.length(1);
			});
		});
		describe('requireUser()', function() {
			it('should forward to data', function() {
				var req = { data: data };
				InsertActions(app, req);

				var requireUser = req.requireUser();

				expect(requireUser).to.be(data.requireUser);
			});
		});
		describe('requireOptions()', function() {
			it('should forward to data', function() {
				var req = { data: { requireOptions: function(arg1) { return arg1; } } };
				InsertActions(app, req);

				var requireOptions = req.requireOptions('title');

				expect(requireOptions).to.be.eql(req.data.requireOptions('title'));
			});
		});
	});
});