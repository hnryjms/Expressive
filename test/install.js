var expect = require('expect.js');
var request = require('supertest');
var _ = require('underscore');

var env = require('./_env');
var Data = require('../data');

var app = require('../app');
var Config = require('../config');

describe('install', function() {
	// All tests run with a cleaned database
	it('should require install', function(done){
		request(app).get('/').expect(function(res) {
			expect(res.header.location).to.be.eql('/install');
		}).end(done);
	});
	it('should require database install', function(done){
		request(app).get('/install').expect(function(res) {
			expect(res.header.location).to.be.eql('/install/database');
		}).end(done);
	});
	describe('database install', function() {
		before(function(){
			// Use a `dummyData` instance to keep any issues out of other tests.
			var config = _.clone(env.config.data);
			var dummyData = new Data(config);
			app.set('data', dummyData);
		});
		beforeEach(function(){
			// Clear the database config
			Config.database({});
		});
		after(function(){
			// Return back to the original data instance after this suite.
			Config.database({});
			app.set('data', env.data);
		});

		it('should allow database install', function(done){
			request(app).get('/install/database').expect(200).end(done);
		});
		it('should assume defaults database setup', function(done){
			request(app).post('/install/database').send({

			}).expect(function(res) {
				expect(res.header.location).to.be.eql('/install/site');

				var config = Config.database();
				expect(config).to.have.property('host', '127.0.0.1');
				expect(config).to.have.property('port', 27017);
				expect(config).to.have.property('database', 'expressive');
			}).end(done);
		});
		it('should allow custom database setup', function(done){
			request(app).post('/install/database').send({
				host: 'localhost',
				port: '27017',
				database: 'mywebsite'
			}).expect(function(res) {
				expect(res.header.location).to.be.eql('/install/site');

				var config = Config.database();
				expect(config).to.have.property('host', 'localhost');
				expect(config).to.have.property('port', 27017);
				expect(config).to.have.property('database', 'mywebsite');
			}).end(done);
		});
		it('should fail invalid database setup', function(done){
			request(app).post('/install/database').send({
				host: 'localhost',
				port: '27017',
				database: 'mywebsite',
				user: 'james',
				pass: 'mypassword'
			}).expect(function(res) {
				expect(res.header.location).to.be.eql('/install/database');
			}).end(done);
		});
	});
	describe('website install', function() {
		before(function(done){
			// Setup with our normal test config
			Config.database({});
			var config = env.config.data;
			app.get('data').try(config, function(){
				Config.database(config);
				done();
			});
		});

		it('should have database pre-setup', function(){
			expect(Config.database().host).to.be.ok();
		});
		it('should skip database setup', function(done){
			request(app).get('/install').expect(function(res) {
				expect(res.header.location).to.be.eql('/install/site');
			}).end(done);
		});
		it('should allow website install', function(done){
			request(app).get('/install/site').expect(200).end(done);
		});
		it('should error password mismatch', function(done){
			request(app).post('/install/site').send({
				title: 'Expressive Tests',

				'name.first': 'James',
				'name.last': 'Smith',
				email: 'james@yourdomain.com',
				password: 'mypassword',
				password_again: 'wrong'
			}).expect(function(res) {
				expect(res.header.location).to.be.eql('/install/site');
			}).end(done);
		});
		it('should allow website setup', function(done){
			request(app).post('/install/site').send({
				title: 'Expressive Tests',

				'name.first': 'James',
				'name.last': 'Smith',
				email: 'james@yourdomain.com',
				password: 'mypassword',
				password_again: 'mypassword'
			}).expect(function(res) {
				expect(res.header.location).to.be.eql('/install/done');
			}).end(done);
		});
	});
});