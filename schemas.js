var Schema = require('mongoose').Schema;
var Mixed = Schema.Types.Mixed;
var ObjectId = Schema.Types.ObjectId;

var Hash = require('password-hash');
var Paginate = require('mongoose-paginate');

var debug = require('debug')('expressive:schemas');

var optionSchema = new Schema({
	name: String,
	value: Mixed
});

var userSchema = new Schema({
	name: {
		first: String,
		last: String
	},
	email: String,
	password: { type: String, set: function(newValue) {
		return Hash.isHashed(newValue) ? newValue : Hash.generate(newValue)
	} },
	active: { type: Boolean, default: true },
	rid: String
});

userSchema.methods.validateUser = function(password, callback) {
	if (!this.name.first || this.name.first.length == 0) {
		var error = new Error("You need to have a first name.");
		error.status = 97811;
		callback(error);
		return;
	}
	if (!this.name.last || this.name.last.length == 0) {
		var error = new Error("You need to have a last name.");
		error.status = 97812;
		callback(error);
		return;
	}
	if (password !== null && !Hash.verify(password, this.password)) {
		var error = new Error("Your passwords did not match.");
		error.status = 97813;
		callback(error);
		return;
	}
	if (password !== null && (!password || password.length < 6)) {
		var error = new Error("Your password must be six or more characters.");
		error.status = 97814;
		callback(error);
		return;
	}
	if (!this.email || !this.email.match(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) {
		var error = new Error("You need a valid email address.");
		error.status = 97815;
		callback(error);
		return;
	}

	var u = this;

	this.model('User').findOne({ email: this.email }, function(err, user) {
		if (user && user.id != u.id) {
			var error = new Error("That email address is already registered.");
			error.status = 97816;
			callback(error);
		} else {
			callback(null);
		}
	});
};

userSchema.methods.validatePassword = function(password) {
	return Hash.verify(password, this.password)
};

userSchema.statics.authenticate = function(email, password, callback) {
	this.findOne({ email: email }, function(error, user) {
		if (user && user.validatePassword(password)) {
			callback(null, user);
		} else if (user || !error) {
			error = new Error("Your email or password was incorrect.");
			error.status = 404;
			callback(error, null);
		} else {
			callback(error, null);
		}
	});
};

userSchema.virtual('name.full').get(function(){
	if (this.name.first === undefined && this.name.last == undefined) {
		return 'New Account';
	}
	return this.name.first + ' ' + this.name.last;
});

userSchema.plugin(Paginate);

module.exports = {
	Option: optionSchema,
	User: userSchema
};