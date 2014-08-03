var expect = require('expect.js');
var request = require('supertest');

process.env.NODE_ENV = 'production';
var data = require('../data');

describe('data', function(){
	it('should have model() function', function(){
		expect(data).to.have.key('model');
	});

	describe('model()', function(){
		describe('User', function(){
			var User = data.model('User');

			it('should return User object', function() {
				expect(User).to.be.a(Object);
				expect(User.modelName).to.eql('User');
			});
			it('should have pagination', function() {
				expect(User).to.have.key('paginate');
			});
			it('should have authenticate static function', function() {
				expect(User).to.have.key('authenticate');
			});

			describe('validateUser()', function() {
				it('should exist', function() {
					var me = new User();

					expect(me.__proto__).to.have.key('validateUser');
				});
				it('should error for missing first name', function(done) {
					var me = new User();
					// me.name.first = 'James';
					me.name.last = 'Smith';
					me.email = 'james@yourdomain.com';
					me.password = 'mypassword';

					me.validateUser('mypassword', function(error) {
						expect(error).to.be.ok();
						expect(error).to.have.key('status');
						expect(error.status).to.be(97811);

						done();
					});
				});
				it('should error for missing last name', function(done) {
					var me = new User();
					me.name.first = 'James';
					// me.name.last = 'Smith';
					me.email = 'james@yourdomain.com';
					me.password = 'mypassword';

					me.validateUser('mypassword', function(error) {
						expect(error).to.be.ok();
						expect(error).to.have.key('status');
						expect(error.status).to.be(97812);

						done();
					});
				});
				it('should error for mismatching password', function(done) {
					var me = new User();
					me.name.first = 'James';
					me.name.last = 'Smith';
					me.email = 'james@yourdomain.com';
					me.password = 'mypassword';
					
					me.validateUser('pass', function(error) {
						expect(error).to.be.ok();
						expect(error).to.have.key('status');
						expect(error.status).to.be(97813);

						done();
					});
				});
				it('should error for short password', function(done) {
					var me = new User();
					me.name.first = 'James';
					me.name.last = 'Smith';
					me.email = 'james@yourdomain.com';
					me.password = 'pass';
					
					me.validateUser('pass', function(error) {
						expect(error).to.be.ok();
						expect(error).to.have.key('status');
						expect(error.status).to.be(97814);

						done();
					});
				});
				it('should error for invalid email', function(done) {
					var me = new User();
					me.name.first = 'James';
					me.name.last = 'Smith';
					me.email = 'james';
					me.password = 'mypassword';
					
					me.validateUser('mypassword', function(error) {
						expect(error).to.be.ok();
						expect(error).to.have.key('status');
						expect(error.status).to.be(97815);

						done();
					});
				});
				/*
				// THIS WILL FAIL BECAUSE IT REQUIERES A DATABASE CONNECTION
				// validateUser() CHECKS THE DB FOR EXISTING EMAILS

				it('should succeed', function(done) {
					var me = new User();
					me.name.first = 'James';
					me.name.last = 'Smith';
					me.email = 'james@yourdomain.com';
					me.password = 'mypassword';
					
					me.validateUser('mypassword', function(error) {
						expect(error).to.not.be.ok();

						done();
					});
				});
				it('should succeed and not validate password', function(done) {
					var me = new User();
					me.name.first = 'James';
					me.name.last = 'Smith';
					me.email = 'james@yourdomain.com';
					me.password = 'mypassword';
					
					me.validateUser(null, function(error) {
						expect(error).to.not.be.ok();

						done();
					});
				});

				*/
			});
			describe('validatePassword()', function() {
				it('should fail', function() {
					var me = new User();
					me.password = 'mypassword';

					expect(me.validatePassword('mypasswor')).to.not.be.ok();
				});
				it('should succeed', function() {
					var me = new User();
					me.password = 'mypassword';

					expect(me.validatePassword('mypassword')).to.be.ok();
				});
			});
		});
		describe('Option', function(){
			it('should return Option object', function() {
				var Option = data.model('Option');
				expect(Option).to.be.a(Object);
				expect(Option.modelName).to.eql('Option');
			});
		});
	});
});