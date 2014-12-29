var express = require('express');
var fs = require('fs');
var path = require('path');
var router = express.Router({ strict: true });
var Config = require('../config');
var _ = require('underscore');

router.use(function(req, res, next) {
	var config = Config.database();
	if (config.installed && !req.user) {
		var err = new Error('Not Found');
	    err.status = 404;
	    next(err);
	} else {
		req.config = config;
		next();
	}
});

router.get('/', function(req, res) {
	if (!!req.config.host && !!req.config.database && !!req.config.port && !!req.config.options) {
		res.redirect('/install/site');
	} else {
		res.redirect('/install/database');
	}
});

router.get('/database', function(req, res) {
	var c = Config.database();
	res.render('admin/install/database', { title: 'Install', isConfigured: !!c.host });
});

router.post('/database', function(req, res) {
	var config = { options: {} };
	if (req.body['host'].length > 0) {
		config.host = req.body['host'];
	} else {
		config.host = '127.0.0.1';
	}
	if (req.body['port'].length > 0) {
		config.port = parseInt(req.body['port']);
	} else {
		config.port = 27017;
	}
	if (req.body['database'].length > 0) {
		config.database = req.body['database'];
	} else {
		config.database = 'expressive';
	}
	if (req.body['user'].length > 0) {
		config.options.user = req.body['user'];
	}
	if (req.body['pass'].length > 0) {
		config.options.pass = req.body['pass'];
	}

	req.data.try(config, function(error) {
		if (error) {
			req.flash('error', 'That connection info doesn\'t seem to work. Try something else maybe?');
			res.redirect('/install/database');
		} else {
			Config.database(config);
			res.redirect('/install/site');
		}
	});
});

router.get('/site', function(req, res, next){
	req.data.requireOptions('title')(req, res, next);
}, function(req, res) {
	var User = req.data.model('User');

	var user = req.user || new User();

	res.render('admin/install/site', { title: 'Install', user: user });
});

router.post('/site', function(req, res) {
	var Option = req.data.model('Option');
	var User = req.data.model('User');

	Option.findOne({ name: 'title' }, function(err, one) {
		if (!one) {
			one = new Option();
			one.name = 'title';
		}

		one.value = req.body['title'];
		one.save(function(err) {
			if (err) {
				req.flash('error', 'We get an error trying to save to the database. Do we have write access?');
				res.redirect('/install/database');
				return;
			}

			var user = req.user || new User();
			user.name.first = req.body['name.first'];
			user.name.last = req.body['name.last'];
			user.email = req.body['email'];
			user.promote('admin');

			if (!req.user || (req.body['password_again'] && req.body['password_again'].length > 0)) {
				user.password = req.body['password_again'];

				if (req.body['password'] != req.body['password_again']) {
					user.invalidate("password", "Your passwords do not match.");
				}
			}

			user.save(function(err) {
				if (err) {
					if (err.name != 'ValidationError') {
						next(err);
						return;
					}

					_.each(err.errors, function(error) {
						req.flash('error', error.message);
					});
					res.redirect('/install/site');
					return;
				}
				// TODO: SETUP BLOG TYPE HERE req.body['home']
				req.login(user, function(err) {
					var c = Config.database();
					c.installed = true;
					c.options.server.auto_reconnect = false;
					Config.database(c);
					res.redirect('/install/done');
				});
			});		
		});
	});
});

router.get('/done', function(req, res, next) {
	req.data.requireOptions('title')(req, res, next);
}, function(req, res) {

	res.render('admin/install/done', { title: 'Install' });
});

module.exports = router;
