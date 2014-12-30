var expect = require('expect.js');
var request = require('supertest');

var env = require('./_env');

var app = require('../app');

describe('app', function() {
	it('should be a function', function(){
		expect(app).to.be.a(Function);
	});

	describe('any request', function() {
		it('should copy req & res to app', function(done){
			request(app).get('/').expect(function(res) {
				expect(app).to.have.key('_req');
				expect(app).to.have.key('_res');
				expect(res.req.path).to.be(app._req.path);
			}).end(done);
		});
		it('should copy data & passport to req', function(done){
			request(app).get('/').expect(function(res) {
				var req = app._req;

				expect(req).to.have.key('data');
				expect(req).to.have.key('passport');
			}).end(done);
		});
	});
});