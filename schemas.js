var Schema = require('mongoose').Schema;
var Mixed = Schema.Types.Mixed;
var ObjectId = Schema.Types.ObjectId;

var Crypt = require('bcrypt');
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
	password: { type: String, validate: [function(value) {
		console.log('Validating:', value, Crypt.getRounds(value));
		return Crypt.getRounds(value) == 10;
	}, 'Password must be a 10-round encrypted hash.'] },
	active: { type: Boolean, default: true },
	rid: String
});

userSchema.methods.setPassword = function(password, callback) {
	var user = this;
	Crypt.hash(password, 10, function(err, hash) {
		if (hash) {
			user.password = hash;
		}
		callback(err);
	});
};

userSchema.methods.validateUser = function(password, callback) {

	var errors = [];
	var user = this;

	(function pass(status) {

		var error = new Error();
		error.status = status;

		switch (status) {
			case 97811:
				if (!user.name.first || user.name.first.length == 0) {
					error.message = "You need to have a first name.";
					errors.push(error);
				}
				pass(97812);
				break;
			case 97812:
				if (!user.name.last || user.name.last.length == 0) {
					error.message = "You need to have a last name.";
					errors.push(error);
				}
				pass(97813);
				break;
			case 97813:
				if (password !== null) {
					Crypt.compare(password, user.password, function(err, match) {
						if (!match) {
							error.message = "Your passwords did not match.";
							errors.push(error);
							pass(97815);
						} else {
							pass(97814);
						};
					});
				} else {
					pass(97815);
				}
				break;
			case 97814:
				if (password !== null && (!password || password.length < 6)) {
					error.message = "Your password must be six or more characters.";
					errors.push(error);
				}
				pass(97815);
				break;
			case 97815:
				var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
				if (!user.email || !user.email.match(emailRegex)) {
					error.message = "You need a valid email address.";
					errors.push(error);
				}
				pass(97816);
				break;
			case 97816:
				if (errors.length == 0) {
					user.model('User').findOne({ email: user.email }, function(err, u) {
						if (u && user.id != u.id) {
							error.message = "That email address is already registered.";
							errors.push(error);
						}
						pass(97817);
					});
				} else {
					pass(97817);
				}
				break;
			default:
				callback(errors.length > 0 ? errors : null);
		}
	})(97811);
};

userSchema.methods.validatePassword = function(password, callback) {
	return Crypt.compare(password, this.password, function(err, match) {
		callback(match, err);
	});
};

userSchema.statics.authenticate = function(email, password, callback) {
	this.findOne({ email: email }, function(error, user) {
		if (user) {
			user.validatePassword(password, function(match) {
				if (match) {
					callback(null, user);
				} else {
					error = new Error("Your email or password was incorrect.");
					error.status = 401;
					callback(error, null);
				};
			});
		} else if (!error) {
			error = new Error("Your email or password was incorrect.");
			error.status = 401;
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