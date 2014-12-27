var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var Mixed = Schema.Types.Mixed;

var debug = require('debug')('expressive:schemas:options');

var Option = new Schema({
	name: String,
	value: Mixed
});

module.exports = Option;
