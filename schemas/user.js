var Mongoose = require('mongoose');
var Schema = Mongoose.Schema;
var STATES = Mongoose.STATES;

var Crypt = require('bcrypt');
var CustomFields = require('mongoose-custom-fields');
var ACL = require('mongoose-acl');
var _ = require('underscore');

var debug = require('debug')('expressive:schemas:user');

var hashSize = 8;

var User = new Schema({
	_acl: Object,
	name: {
		first: { type: String, required: 'You must enter your first name.' },
		last: { type: String, required: 'You must enter your last name.' }
	},
	email: { type: String, required: 'You must enter your email.' },
	password: { type: String },
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
	if (!value) {
		// New users don't have a password
		return true;
	}
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

User.methods.can = function(role, permissions) {
	var user = this;

	if (typeof role == 'string') {
		// Create anonymous ACL object for a role (on the current user)
		var roleName = role;
		role = {
			getAccess: function(key) {
				return (user._acl || {})['role:' + roleName] || [];
			},
			setAccess: function(user_key, value) {
				user._acl || (user._acl = {});
				user._acl['role:' + roleName] = value;
				user.markModified('_acl');
			}
		};
	};
	if ((role.collection || {}).name == 'users') {
		// Create anonymous ACL object for permissions (on any user).
		var otherUser = role;
		role = {
			getAccess: function(key) {
				return (otherUser._acl || {})[key] || [];
			},
			setAccess: function(user_key, value) {
				otherUser._acl || (otherUser._acl = {});
				otherUser._acl[user_key] = value;
				otherUser.markModified('_acl');
			}
		}
	};

	if (permissions === null) {
		// Remove all permission for role
		user.setAccess(role, []);
	} else if (typeof permissions == 'string' || permissions === undefined) {
		// Get permissions for role
		var abilites = user.getAccess(role);
		if (permissions) {
			return abilites.indexOf(permissions) >= 0;
		} else {
			return abilites;
		}
	} else {
		// Set permissions for role
		user.setAccess(role, permissions);
	}
}
User.methods.promote = function(level) {
	var user = this;

	user._acl = {};
	if (level == 'admin') {
		user.can('users', [ 'read', 'write' ]);
	}
}
User.pre('save', function(next) {
	var user = this;
	if (!user._acl || !user.can(user, 'read')) {
		// Setup or repair minimum user permissions
		user.can(user, [ 'read', 'write' ]);
	}
	next();
});
User.statics.withAccess = function(subject, perms, callback) {
	if (typeof subject == 'string') {
		subject = [ subject ];
	}
	if (_.isArray(subject)) {
		var roles = subject;
		subject = {
			getAccessKeys: function() {
				return _.map(roles, function(value) {
					return 'role:' + value;
				});
			}
		}
	}
    var keys = subject.getAccessKeys();

    var or = keys.map(function(key) {
        var query = {};
        var path = ['_acl', key].join('.');

        query[path] = { $all: perms };
        return query;
    });

    var cursor = this.find({ $or: or });

    if (callback) {
        cursor.exec(callback);
    }

    return cursor;
};
var toJSON = User.methods.toJSON;
User.methods.toJSON = function() {
    var data = toJSON ? toJSON.call(this) : this.toObject();
    delete data['_acl'];
    return data;
};

User.plugin(CustomFields);
User.plugin(ACL.subject);

module.exports = User;
