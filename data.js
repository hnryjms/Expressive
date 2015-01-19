var debug = require('debug')('expressive:data');

var fs = require('fs');
var path = require('path');
var Handlebars = require('handlebars');
var nodemailer = require('nodemailer');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var hat = require('hat');
//var Dust = require('')

var passport = require('passport');
var PassportLocalStrategy = require('passport-local');
var Mongoose = require('mongoose');
var Session = require('express-session');
var MongoStore = require('connect-mongo')(Session);

var Config = require('./config');

var Data = function(baseConfig, callback) {
	var databaseConfig = baseConfig || Config.database();

	_.extend(databaseConfig, baseConfig);

	var models = {};
	var connection = Mongoose.createConnection();
	var schemas = require('./schemas');
	var data = this;
	var session = Session({
		secret: 'expressive-fothzxhcgl9wiks',
		key: 'expressive.session',
		resave: true,
		saveUninitialized: false
	});
	var mailConfig = databaseConfig.mail || {
		transport: 'sendmail'
	}
	var mail = nodemailer.createTransport(mailConfig.transport, mailConfig);

	this.uid = hat();
	this._connection = connection;

	this._passport = new passport.Passport();

	var strategy = new PassportLocalStrategy({
		usernameField: 'email',
		passwordField: 'password'
	}, function(email, password, done) {
		var User = models['User'];

		User.authenticate(email, password, function(error, user){
			// You can write any kind of message you'd like.
			// The message will be displayed on the next page the user visits.
			// We're currently not displaying any success message for logging in.
			done(error && error.status != 401 ? error : null, user, error && error.status == 401 ? { message: error.message } : null);
		});
	});
	var authSerializer = function(user, done) {
		done(null, user.id);
	};
	var authDeserializer = function(id, done) {
		models['User'].findById(id, function(error, user) {
			done(error, user);
		});
	};

	data._passport.use(strategy);
	data._passport.serializeUser(authSerializer);
	data._passport.deserializeUser(authDeserializer);

	connection.on('open', function(){
		data.is.connected = true;
		debug('MongoDB is now connected.');
		models['Option'].findOne({ name: 'title' }, function(error, option) {
			if (option) {
				data.is.configured = true;
				debug('Expressive has been set up with this database.');
			} else if (data.is.configured) {
				data.is.configured = false;
				debug('Expressive has been uninstalled from this database.');
			}
			debug('Switching to database sessions.');
			session = Session({
				secret: 'expressive-fothzxhcgl9wiks',
				key: 'expressive.session',
				store: new MongoStore({
					mongooseConnection: connection
			    }),
			    resave: true,
			    saveUninitialized: false
			});

			connection.emit('done');
			data.emit('ready');
		});
	});

	connection.on('close', function(){
		debug('MongoDB closed our connection.');
		data.is.connected = false;
		connection._hasOpened = false;
		session = Session({
			secret: 'expressive-fothzxhcgl9wiks',
			key: 'expressive.session',
			resave: true,
			saveUninitialized: false
		});
	});

	connection.on('error', function(error) {
		debug('Error connecting to MongoDB (%s)', error.message);
		if (connection.db) {
			connection.db.close();
		};
		connection.emit('done', error);
	});

	this.is = { configured: databaseConfig.installed || false };

	this.model = function(name, schema) {
		if (model === null) {
			debug('Removing all objects of model %s from database.', name);
		} else if (!!schema) {
			debug('Adding model %s to system', name);
			var model = connection.model(name, schema);
			models[name] = model;
		} else if (schema == undefined) {
			return models[name];
		}
	}
	this.try = function(newConfig, callback) {
		if (typeof newConfig == 'function') {
			callback = newConfig;
			newConfig = null;
		};

		if (newConfig) {
			_.extend(databaseConfig, newConfig);
		};

		debug('Connecting to database', databaseConfig);

		if (connection.readyState == Mongoose.STATES['connected']) {
			connection.close(function(){
				data.try(databaseConfig, callback);
			});
		} else {
			connection.open(databaseConfig.host, databaseConfig.database, databaseConfig.port || 27017, databaseConfig.options || {}, callback);
		}
	};
	this.requireOptions = function() {
		var args = Array.prototype.slice.call(arguments, 0);
		return function(req, res, next) {
			var Option = models['Option'];
			if (data.is.connected) {
				Option.find({ name: { $in: args } }, function(error, options) {
					if (!error && options.length > 0) {
						data.is.configured = true;
					}
					var opts = {};
					for (var i = 0; i < options.length; i++) {
						opts[options[i].name] = options[i].value;
					};
					req.options = opts;
					res.locals.options = opts;
					next();
				});
			} else {
				req.options = {};
				res.locals.options = {};
				next();
			}
		}
	}
	this.requireUser = function(req, res, role, success, next) {
		if (!next) {
			next = success;
			success = null;
		};
		if (!next) {
			next = role;
			role = null;
		};
		if (typeof role == 'function') {
			success = role;
			role = null;
		};

		if (!req.user) {
			var err = new Error("You must be logged in to access this page.");
			err.status = 401;
			next(err);
		} else {
			if (role) {
				var isCapable = true;
				_.each(role, function(value, key) {
					if (!_.isArray(value)) {
						value = [ value ];
					};
					_.each(value, function(name) {
						if (isCapable) {
							isCapable = req.user.can(key, name);
						}
					});
				});
				if (!isCapable) {
					var err = new Error("You do not have permission to do this.");
					err.status = 401;
					next(err);
					return;
				}
			};

			if (success) {
				success(req, res, next)
			} else {
				next();
			}
		}
	}
	this.passport = function(){
		return function dataPassport(req, res, next) {
			if (!data._passport) {
				next();
				return;
			};
			data._passport.initialize()(req, res, function(){
				data._passport.session()(req, res, function(){
					req.passport = data._passport;
					next();
				});
			});
		};
	}
	this.session = function(){
		return function dataSession(req, res, next) {
			session(req, res, next);
		};
	}
	this.hbs = function(str) {
		return Handlebars.compile(str);
	}
	this.engines = {
		html: function(file, options, callback) {
			var partials = options.partials || {};
			var keys = Object.keys(partials);
			var next = function(index) {
				if (index < keys.length) {
					var partial = partials[keys[index]];
					fs.readFile(path.join(file, '../', partial + '.html'), 'utf8', function(err, str) {
						if (!err) {
							partials[keys[index]] = str;
						}
						next(++index);
					});
				} else {
					fs.readFile(file, 'utf8', function(err, str) {
						try {
							var template = Handlebars.compile(str);
							for (var partial in partials) {
								Handlebars.registerPartial(partial, partials[partial]);
							};
							for (var helper in options.helpers) {
								Handlebars.registerHelper(helper, options.helpers[helper]);
							};
							callback(null, template(options));
						} catch (err) {
							callback(err);
						}
					});
				}
			}
			next(0);
		}
	}
	this.mail = function(to, subject, text, options) {
		options = options || {};
		options.to = to;
		options.subject = subject;
		options.text = text;

		if (!options.from) {
			options.from = '"Expressive" <no-reply@z43studio.com>';
		}

		return mail.sendMail(options);
	}
	for (var schemaType in schemas) {
		var schema = schemas[schemaType];
		this.model(schemaType, schema);
	};

	this.try(databaseConfig, callback);
};

Data.prototype.__proto__ = EventEmitter.prototype;
Data.prototype.STATES = Mongoose.STATES;

module.exports = Data;