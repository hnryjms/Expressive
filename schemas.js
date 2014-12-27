var Schema = require('mongoose').Schema;
var Mixed = Schema.Types.Mixed;
var ObjectId = Schema.Types.ObjectId;

var Crypt = require('bcrypt');
var Paginate = require('mongoose-paginate');
var CustomFields = require('mongoose-custom-fields');

var hashSize = 8;

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
	password: { type: String },
	active: { type: Boolean, default: true },
	rid: String
});

userSchema.path('name.first').validate(function(value) {
	return value.length > 0;
}, 'You must enter your first name.');

userSchema.path('name.last').validate(function(value) {
	return value.length > 0;
}, 'You must enter your last name.');

userSchema.virtual('name.display').get(function(){
	if (this.name.first === undefined && this.name.last === undefined) {
		return 'New Account';
	}
	
	return this.name.first + ' ' + this.name.last;
});

userSchema.path('email').validate(function(value) {
	var emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return value.match(emailRegex);
}, 'You must enter a valid email address.');

userSchema.path('email').validate(function(value, next) {
	var user = this;
	var User = this.model('User');
	User.findOne({ email: value }, function(err, existing) {
		var valid = existing && (existing.id == user.id);
		next(valid);
	});
}, 'Your email address already is registered to an account.');

userSchema.path('password').validate(function(value) {
	console.log('Validating pass', value);
	if (value.indexOf('$2a$') === 0 && Crypt.getRounds(value) == hashSize) {
		// All hashed passwords have already been validated.
		return true;
	}

	return false;
}, 'Unexpected error encrypting, hashing & salting your password.');

userSchema.pre('save', function(next) {
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

userSchema.statics.authenticate = function(email, password, callback) {
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

userSchema.methods.authenticate = function(password, callback) {
	Crypt.compare(password, this.password, function(err, matches) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, matches);
	});
}

userSchema.plugin(Paginate);
userSchema.plugin(CustomFields);

module.exports = {
	Option: optionSchema,
	User: userSchema
};