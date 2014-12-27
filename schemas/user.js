var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var STATES = Mongoose.STATES;

var Crypt = require('bcrypt');
var Paginate = require('mongoose-paginate');
var CustomFields = require('mongoose-custom-fields');
var ACL = require('mongoose-acl');

var debug = require('debug')('expressive:schemas:user');

var hashSize = 8;

var User = new Schema({
	name: {
		first: { type: String, required: 'You must enter your first name.' },
		last: { type: String, required: 'You must enter your last name.' }
	},
	email: { type: String, required: 'You must enter your email.' },
	password: { type: String, required: 'You must enter a password.' },
	active: { type: Boolean, default: true },
	rid: String
});

User.virtual('name.display').get(function(){
	if (this.name.first === undefined && this.name.last === undefined) {
		return 'New Account';
	}

	return this.name.first + ' ' + this.name.last;
});

User.path('email').validate(function(value) {
	var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return value.match(emailRegex);
}, 'You must enter a valid email address.');

User.path('email').validate(function(value, next) {
	var user = this;
	var User = this.model('User');
	var connection = User.db;
	if (connection.readyState == STATES['connected']) {
		User.findOne({ email: value }, function(err, existing) {
			var valid = !existing || (existing && existing.id == user.id);
			next(valid);
		});
	} else {
		next(true);
	}
}, 'Your email address already is registered to an account.');

User.path('password').validate(function(value) {
	if (value.indexOf('$2a$') === 0 && Crypt.getRounds(value) == hashSize) {
		// All hashed passwords have already been validated.
		return true;
	}

	if (value.length >= 6) {
		return true;
	}

	return false;
}, 'Your password must be six characters or longer.');

User.pre('save', function(next) {
	var user = this;
	if (user.password && (user.password.indexOf('$2a$') !== 0 || Crypt.getRounds(user.password) != hashSize)) {
		if (user.password.length < 6) {
			user.invalidate('password', 'Your password must be six characters or longer.');
		}

		Crypt.hash(user.password, hashSize, function(err, hash) {
			user.password = hash;
			next(err);
		});
	} else {
		next();
	}
});

User.statics.authenticate = function(email, password, callback) {
	this.findOne({ email: email }, function(err, user) {
		var send = function(err, user) {
			if (err) {
				err.status = 500;
				callback(err);
				return;
			}

			if (user) {
				callback(null, user);
				return;
			}

			var error = new Error("Your email address or password is wrong.");
			error.status = 401;
			callback(error);
		}

		if (err) {
			send(err);
			return;
		}

		if (user) {
			Crypt.compare(password, user.password, function(err, matches) {
				if (err) {
					send(err);
					return;
				}

				if (matches) {
					send(null, user);
					return;
				}

				send();
			});
		} else {
			send();
		}
	});
};

User.methods.authenticate = function(password, callback) {
	Crypt.compare(password, this.password, function(err, matches) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, matches);
	});
}

User.plugin(Paginate);
User.plugin(CustomFields);
User.plugin(ACL.subject);

module.exports = User;
