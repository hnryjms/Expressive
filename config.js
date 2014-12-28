var path = require('path');
var fs = require('fs');

var _perform = function(config, write) {
	if (write) {
		var configDir = path.join(config, '../');
		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir);
		}
		fs.writeFileSync(config, JSON.stringify(write, null, '\t'));

		return write;
	} else {
		if (!fs.existsSync(config)) {
			return {};
		};
		return JSON.parse(fs.readFileSync(config, 'utf8')) || {};
	}
}

var database = function(write) {
	var config = path.join(__dirname, 'config', 'database.json');

	return _perform(config, write);
}

var app = function(write) {
	var config = path.join(__dirname, 'config', 'app.json');
	
	return _perform(config, write);
}

module.exports = {
	database: database,
	app: app
}