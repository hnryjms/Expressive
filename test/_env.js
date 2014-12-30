var Data = require('../data');
var app = require('../app');

var dataConfig = {
	host: '127.0.0.1',	
	database: 'expressive-tests'
};

var data = new Data(dataConfig);

// Setup environment

app.set('data', data);

// Ensure MongoDB connection
// Clean database before every test
beforeEach(function(ready) {
	var isConnectionRequired = (app.get('data') == data);

	var data = app.get('data');
	var cleanDB = function(){
		data.is.configured = false;
		(function next(i){
			var key = Object.keys(data._connection.collections)[i];
			if (!key) {
				ready();
				return;
			}

			var collection = data._connection.collections[key];
			collection.remove({}, function(err){ if (isConnectionRequired) next(++i); });
			if (!isConnectionRequired) {
				next(++i);
			}
		})(0);
	}
	if (data.is.connected || !isConnectionRequired) {
		cleanDB();
	} else {
		data.once('ready', cleanDB);
	}
});

module.exports = {
	data: data,
	config: {
		data: dataConfig
	}
}