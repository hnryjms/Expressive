var Data = require('../data');
var app = require('../app');
var _ = require('underscore');

var dataConfig = {
	host: '127.0.0.1',	
	database: 'expressive-tests'
};

var data = new Data(dataConfig);

// Setup environment

var skipDB = process.env.EXP_SKIP_DB;

app.set('data', data);

// Ensure MongoDB connection
// Clean database before every test
beforeEach(function(ready) {
	var isConnectionRequired = (app.get('data').uid == data.uid) && !skipDB;

	var testData = app.get('data');
	var cleanDB = function(){
		testData.is.configured = false;
		(function next(i){
			var key = Object.keys(testData._connection.collections)[i];
			if (!key) {
				ready();
				return;
			}

			var collection = testData._connection.collections[key];
			function finish(){
				next(++i);
			}

			if (!isConnectionRequired) {
				collection.remove({}, function(){});
				finish();
			} else {
				collection.remove({}, finish);
			}
		})(0);
	}
	if (testData.is.connected || !isConnectionRequired) {
		cleanDB();
	} else {
		testData.once('ready', cleanDB);
	}
});

module.exports = {
	data: data,
	config: {
		data: dataConfig
	},
	describe: {
		database: (!skipDB ? describe : describe.skip)
	},
	it: {
		database: (!skipDB ? it : it.skip)
	}
}