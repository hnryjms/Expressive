var expect = require('expect.js');
var request = require('supertest');

var env = require('./_env');
var data = env.data;

describe('data', function(){
	it('should have model() function', function(){
		expect(data).to.have.key('model');
	});

	describe('model()', function(){
		require('./data/user')(data);
		require('./data/option')(data);
	});
});