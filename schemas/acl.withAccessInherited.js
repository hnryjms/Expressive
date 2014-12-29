var _ = require('underscore');

var modify = function(Schema) {
	var withAccess = Schema.statics.withAccess;
	Schema.statics.withAccess = function(subject, perms, callback) {
		var cursor = withAccess.call(this, subject, perms);

		var keys = subject.getAccessKeys();

		var and = keys.map(function(key) {
		    var query = {};
		    var path = ['_acl', key].join('.');

		    query[path] = { $exists: false };
		    return query;
		});

		var parent = (subject.collection || {}).name;
		var masterPermission = _.reduce(perms, function(could, role) {
			return could && subject.can(parent, role);
		}, true);

		if (masterPermission) {
			// The user has the master permission, so add all
			// objects that don't have any ACL for this user.
			cursor.or({ $and: and });
		};

		if (callback) {
		    cursor.exec(callback);
		}

		return cursor;
	};
};

module.exports = modify;
