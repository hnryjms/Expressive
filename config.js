var path = require('path');
var fs = require('fs');

var debug = require('debug')('expressive:config');

var memCache = false;

if (process.env.NODE_ENV == 'test') {
	debug('Testing environment uses memory cache (not filesystem).');
	memCache = {};
}

var _perform = function(config, write) {
	if (write) {
		if (memCache) {
			memCache[config] = write;
			return true;
		}

		var configDir = path.join(config, '../');
		if (!fs.existsSync(configDir)) {
			fs.mkdirSync(configDir);
		}
		fs.writeFileSync(config, JSON.stringify(write, null, '\t'));

		return write;
	} else {
		if (memCache) {
			return memCache[config] || {};
		}
		
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

module.exports = {
	database: database
}