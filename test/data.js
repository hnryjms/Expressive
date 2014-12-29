var expect = require('expect.js');
var request = require('supertest');

var Data = require('../data');
var data = new Data({
	database: 'expressive-tests'
});

describe('data', function(){
	it('should have model() function', function(){
		expect(data).to.have.key('model');
	});

	describe('model()', function(){
		
		before(function(ready) {
			if (data.is.connected) {
				ready();
			} else {
				data.once('ready', ready);
			}
		});
		beforeEach(function(ready) {
			(function next(i){
				var key = Object.keys(data._connection.collections)[i];
				if (!key) {
					ready();
					return;
				}

				var collection = data._connection.collections[key];
				collection.remove({}, function(){ next(++i); });
			})(0);
		});

		require('./data/user')(data);

		describe('Option', function(){
			it('should return Option object', function() {
				var Option = data.model('Option');
				expect(Option).to.be.a(Object);
				expect(Option.modelName).to.eql('Option');
			});
		});
	});
});