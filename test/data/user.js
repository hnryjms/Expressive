var expect = require('expect.js');
var _ = require('underscore');

var userTests = function(data) {

	// We assume `data` is already an active connnection.
	// We assume each test has a cleared database.

	describe('User', function(){
		var User = data.model('User');

		var fullUser = function(email, password) {
			var me = new User();
			me.name.first = 'James';
			me.name.last = 'Smith';
			me.email = email;
			me.password = password;
			
			return me;
		}

		it('should return User object', function() {
			expect(User).to.be.a(Object);
			expect(User.modelName).to.eql('User');
		});
		it('should combine full name', function() {
			var me = new User();
			me.name.first = 'James';
			me.name.last = 'Smith';

			expect(me.name.display).to.be.eql('James Smith');
		});
		it('should display new user', function() {
			var me = new User();

			expect(me.name.display).to.be.eql('New Account');
		});
		it('should list custom keys', function() {
			var me = new User();
			me.customField('birthday', new Date());
			me.customField('theme', 'admin-red.css');

			expect(me.customKeys).to.be.an(Array);
			expect(me.customKeys).to.have.length(2);
			expect(me.customKeys).to.contain('birthday');
			expect(me.customKeys).to.contain('theme');
		});

		describe('Validation', function() {
			it('should error for missing first name', function(done) {
				var me = new User();
				// me.name.first = 'James';
				me.name.last = 'Smith';
				me.email = 'james@yourdomain.com';
				me.password = 'mypassword';
				me.validate(function(error) {
					expect(error.name).to.be.eql('ValidationError');
					expect(error.errors).to.be.an(Object);
					expect(error.errors).to.have.key('name.first');

					done();
				});
			});
			it('should error for missing last name', function(done) {
				var me = new User();
				me.name.first = 'James';
				// me.name.last = 'Smith';
				me.email = 'james@yourdomain.com';
				me.password = 'mypassword';
				me.validate(function(error) {
					expect(error.name).to.be.eql('ValidationError');
					expect(error.errors).to.be.an(Object);
					expect(error.errors).to.have.key('name.last');

					done();
				});
			});
			it('should error for short password', function(done) {
				var me = new User();
				me.name.first = 'James';
				me.name.last = 'Smith';
				me.email = 'james@yourdomain.com';
				me.password = 'pass';
				me.validate(function(error) {
					expect(error.name).to.be.eql('ValidationError');
					expect(error.errors).to.be.an(Object);
					expect(error.errors).to.have.key('password');

					done();
				});
			});
			it('should error for invalid email', function(done) {
				var me = new User();
				me.name.first = 'James';
				me.name.last = 'Smith';
				me.email = 'james';
				me.password = 'mypassword';
				me.validate(function(error) {
					expect(error.name).to.be.eql('ValidationError');
					expect(error.errors).to.be.an(Object);
					expect(error.errors).to.have.key('email');

					done();
				});
			});

			it('should succeed', function(done) {
				var me = new User();
				me.name.first = 'James';
				me.name.last = 'Smith';
				me.email = 'james@yourdomain.com';
				me.password = 'mypassword';
				
				me.validate(function(error) {
					expect(error).to.not.be.ok();

					done();
				});
			});
			it('should succeed without password', function(done) {
				var me = new User();
				me.name.first = 'James';
				me.name.last = 'Smith';
				me.email = 'james@yourdomain.com';
				me.markModified('password');
				
				me.validate(function(error) {
					expect(error).to.not.be.ok();

					done();
				});
			});
		});
		describe('Save', function() {
			it('should succeed', function(done) {
				var me = new User();
				me.name.first = 'James';
				me.name.last = 'Smith';
				me.email = 'james@yourdomain.com';
				me.password = 'mypassword';

				me.save(function(err) {
					expect(err).to.not.be.ok();

					done();
				});
			});
			it('should encrypt password', function(done) {
				var me = new User();
				me.name.first = 'James';
				me.name.last = 'Smith';
				me.email = 'james@yourdomain.com';
				me.password = 'mypassword';

				me.save(function(err) {
					expect(err).to.not.be.ok();
					expect(me.password).to.match(/^\$2a\$/);

					done();
				});
			});
			it('should not double-encrypt password', function(done) {
				var me = new User();
				me.name.first = 'James';
				me.name.last = 'Smith';
				me.email = 'james@yourdomain.com';
				me.password = 'mypassword';

				me.save(function(err) {
					expect(err).to.not.be.ok();
					expect(me.password).to.match(/^\$2a\$/);

					var originalEncrypt = me.password;
					me.name.first = 'John';
					me.markModified('password');

					me.save(function(err) {
						expect(err).to.not.be.ok();
						expect(me.password).to.be.eql(originalEncrypt);

						done();
					});
				});
			});
		});
		describe('authenticate()', function() {
			it('should exist', function() {
				expect(User).to.have.key('authenticate');

				var me = new User();
				expect(me.authenticate).to.be.a(Function);
			});
			it('should error missing parameters', function(done) {
				User.authenticate(null, null, function(err, user) {
					expect(err).to.be.ok();
					expect(err).to.be.an(Error);
					expect(user).to.not.be.ok();

					User.authenticate('james@yourdomain.com', null, function(err, user) {
						expect(err).to.be.ok();
						expect(err).to.be.an(Error);
						expect(user).to.not.be.ok();

						User.authenticate(null, 'mypassword', function(err, user) {
							expect(err).to.be.ok();
							expect(err).to.be.an(Error);
							expect(user).to.not.be.ok();

							done();
						});
					});
				});
			});
			it('should error wrong email', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');
				me.save(function(err) {
					expect(err).to.not.be.ok();

					User.authenticate('wrong@yourdomain.com', 'mypassword', function(err, user) {
						expect(err).to.be.ok();
						expect(err).to.be.an(Error);
						expect(err.status).to.be(401);
						expect(user).to.not.be.ok();

						done();
					});
				});
			});
			it('should error wrong password', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');
				me.save(function(err) {
					expect(err).to.not.be.ok();

					User.authenticate('james@yourdomain.com', 'wrong', function(err, user) {
						expect(err).to.be.ok();
						expect(err).to.be.an(Error);
						expect(err.status).to.be(401);
						expect(user).to.not.be.ok();

						done();
					});
				});
			});
			it('should succeed', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');
				me.save(function(err) {
					expect(err).to.not.be.ok();

					User.authenticate('james@yourdomain.com', 'mypassword', function(err, user) {
						expect(err).to.not.be.ok();
						expect(user).to.be.ok();

						expect(user.id).to.be.eql(me.id);

						done();
					});
				});
			});
		});
		describe('user.authenticate()', function() {
			it('should exist', function() {
				var me = fullUser('james@yourdomain.com', 'mypassword');

				expect(me.authenticate).to.be.a(Function);
			});
			it('should error missing parameters', function() {
				var me = fullUser('james@yourdomain.com', 'mypassword');

				me.authenticate(null, function(err, matches) {
					expect(err).to.be.ok();
					expect(err).to.be.an(Error);
				});
			});
			it('should fail', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');

				me.save(function(err) {
					expect(err).to.not.be.ok();

					me.authenticate('wrong', function(err, matches) {
						expect(err).to.not.be.ok();
						expect(matches).to.not.be.ok();

						done();
					});
				});
			});
			it('should succeed', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');

				me.save(function(err) {
					expect(err).to.not.be.ok();

					me.authenticate('mypassword', function(err, matches) {
						expect(err).to.not.be.ok();
						expect(matches).to.be.ok();

						done();
					});
				});
			});
		});
		describe('user.toJSON()', function() {
			it('should remove ACL', function() {
				var me = fullUser('james@yourdomain.com', 'mypassword');

				me.can('users', ['read','write']);
				var json = me.toJSON();

				expect(json._acl).to.be(undefined);
			});
		});
		describe('user.can()', function() {
			it('should exist', function() {
				var me = new User();

				expect(me.can).to.be.a(Function);
			});
			it('should save', function() {
				var me = new User();

				me.can('users', ['read', 'write']);
				expect(me._acl).to.have.key('role:users');
				expect(me._acl['role:users']).to.be.eql(['read', 'write']);
			});
			it('should remove', function() {
				var me = new User();

				me.can('users', ['read', 'write']);
				me.can('users', null);
				expect(me._acl['role:users']).to.not.be.ok();
			});
			it('should deny for missing', function() {
				var me = new User();

				var canRead = me.can('users', 'read');
				expect(canRead).to.not.be.ok();
			});
			it('should deny for excluded', function() {
				var me = new User();
				me.can('users', ['read']);

				var canWrite = me.can('users', 'write');
				expect(canWrite).to.not.be.ok();
			});
			it('should allow for included', function() {
				var me = new User();
				me.can('users', ['read', 'write']);

				var canWrite = me.can('users', 'write');
				expect(canWrite).to.be.ok();
			});
			it('should relationship accept', function() {
				var me = new User();
				var you = new User();

				me.can(you, ['read', 'write']);
				expect(you._acl).to.have.keys(me.getAccessKeys());
			});
			it('should relationship deny', function() {
				var me = new User();
				var you = new User();

				me.can(you, ['read']);

				var canWrite = me.can(you, 'write');
				expect(canWrite).to.not.be.ok();
			});
			it('should relationship accept', function() {
				var me = new User();
				var you = new User();

				me.can(you, ['read', 'write']);

				var canWrite = me.can(you, 'write');
				expect(canWrite).to.be.ok();
			});
			it('should collection inherit', function() {
				var me = new User();
				var you = new User();

				me.can('users', ['read', 'write']);

				var canWrite = me.can(you, 'write');
				expect(canWrite).to.be.ok();
			});
			it('should not inhert when explicit', function() {
				var me = new User();
				var you = new User();

				me.can('users', ['read', 'write']);
				me.can(you, ['read']);

				var canWrite = me.can(you, 'write');
				expect(canWrite).to.not.be.ok();
			});
		});
		describe('user.promote()', function() {
			it('should exist', function() {
				var me = new User();

				expect(me.promote).to.be.a(Function);
			});
			it.skip('should add admin permissions', function() {
				var me = new User();

				me.promote('admin');

				var roles = {
					users: [ 'read', 'write' ],
					posts: [ 'read', 'write' ],
					pages: [ 'read', 'write' ],
					media: [ 'read', 'write' ],
					themes: [ 'read', 'write' ],
					options: [ 'read', 'write' ]
				};
				_.each(roles, function(perms, role) {
					_.each(perms, function(perm) {
						var canPerform = me.can(role, perm);
						if (!canPerform) {
							throw new Error("Admin should have role: " + role + "#" + perm);
						}
					});
				});
			});
		});
		describe('withAccess', function() {
			it('should exist', function() {
				expect(User.withAccess).to.be.a(Function);
			});
			it('should find me', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');

				me.can(me, ['read', 'write']);

				me.save(function(err) {
					expect(err).to.not.be.ok();

					User.withAccess(me, ['read','write'], function(err, users) {
						expect(err).to.not.be.ok();
						expect(users).to.have.length(1);
						expect(users[0].id).to.be.eql(me.id);

						done();
					});
				});
			});
			it('should not find me', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');

				me.can(me, ['read']);

				me.save(function(err) {
					expect(err).to.not.be.ok();

					User.withAccess(me, ['write'], function(err, users) {
						expect(err).to.not.be.ok();
						expect(users).to.have.length(0);

						done();
					});
				});
			});
			it('should find inherited', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');
				var you = fullUser('john@yourdomain.com', 'yourpassword');

				me.can('users', ['read', 'write']);

				me.save(function(err) {
					expect(err).to.not.be.ok();

					you.save(function(err) {
						expect(err).to.not.be.ok();

						User.withAccess(me, ['write'], function(err, users) {
							expect(err).to.not.be.ok();
							expect(users).to.have.length(2);

							done();
						});
					});
				});
			});
			it('should not find explicit', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');
				var you = fullUser('john@yourdomain.com', 'yourpassword');

				me.can('users', ['read', 'write']);
				me.can(you, ['read']);

				me.save(function(err) {
					expect(err).to.not.be.ok();

					you.save(function(err) {
						expect(err).to.not.be.ok();

						User.withAccess(me, ['write'], function(err, users) {
							expect(err).to.not.be.ok();
							expect(users).to.have.length(1);
							expect(users[0].id).to.be.eql(me.id);

							done();
						});
					});
				});
			});
			it('should find roles', function(done) {
				var me = fullUser('james@yourdomain.com', 'mypassword');

				me.can('users', ['read', 'write']);

				me.save(function(err) {
					expect(err).to.not.be.ok();

					User.withAccess('users', ['write'], function(err, users) {
						expect(err).to.not.be.ok();
						expect(users).to.have.length(1);
						expect(users[0].id).to.be.eql(me.id);

						done();
					});
				});
			});
		});
	});
}

module.exports = userTests;
