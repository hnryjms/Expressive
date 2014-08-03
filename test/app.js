var expect = require('expect.js');

var app = require('../app');

describe('app', function() {
	it('should be a function', function(){
		expect(app).to.be.a(Function);
	})
})