var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var Mixed = Schema.Types.Mixed;

var ACL = require('mongoose-acl');

var debug = require('debug')('expressive:schemas:options');

var Option = new Schema({
	name: String,
	value: Mixed
});

Option.plugin(ACL.object);

module.exports = Option;
