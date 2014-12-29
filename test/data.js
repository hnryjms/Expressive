var expect = require('expect.js');
var request = require('supertest');

var Data = require('../data');
var data = new Data({
	host: '127.0.0.1',	
	database: 'expressive-tests'
});

describe('data', function(){
	it('should have model() function', function(){
		expect(data).to.have.key('model');
	});

	describe('model()', function(){
		beforeEach(function(ready) {
			var cleanDB = function(){
				(function next(i){
					var key = Object.keys(data._connection.collections)[i];
					if (!key) {
						ready();
						return;
					}

					var collection = data._connection.collections[key];
					collection.remove({}, function(){ next(++i); });
				})(0);
			}
			if (data.is.connected) {
				cleanDB();
			} else {
				data.once('ready', cleanDB);
			}
		});

		require('./data/user')(data);
		require('./data/option')(data);
	});
});