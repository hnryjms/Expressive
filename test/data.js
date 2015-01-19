var expect = require('expect.js');

var env = require('./_env');
var data = env.data;

describe('data', function(){
	it('should have model() function', function(){
		expect(data.model).to.be.a(Function);
	});

	describe('model()', function(){
		require('./data/user')(data);
		require('./data/option')(data);
	});
});