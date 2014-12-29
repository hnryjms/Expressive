var expect = require('expect.js');
var request = require('supertest');

process.env.NODE_ENV = 'production';
var Data = require('../data');
var data = new Data({
	database: 'expressive-tests'
});

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

			it('should combine full name', function() {
				var me = new User();
				me.name.first = 'James';
				me.name.last = 'Smith';

				expect(me.name.display).to.be.eql('James Smith');
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

			describe('authenticate()', function() {
				it('should exist', function() {
					expect(User).to.have.key('authenticate');

					var me = new User();
					expect(me.authenticate).to.be.a(Function);
				});

				// Not testable because we don't have a fake Mongoose connection
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
			describe('customField()', function() {
				it('should exist', function() {
					var me = new User();

					expect(me.__proto__).to.have.key('customField');
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