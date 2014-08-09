var express = require('express');
var fs = require('fs');
var path = require('path');
var router = express.Router({ strict: true });

router.use(function(req, res, next) {
	var config = require('../config.json') || {};
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
	var c = require('../config.json') || {};
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
			fs.writeFile(path.join(__dirname, '../', 'config.json'), JSON.stringify(config, null, '\t'), function(error){
				res.redirect('/install/site');
			});
		}
	});
});

router.get('/site', function(req, res, next){
	req.data.optionLoader('title')(req, res, next);
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

			var pass = function() {
				user.validateUser(req.body['password'], function(errors) {
					if (errors) {
						for (var i = 0; i < errors.length; i++) {
							console.log('Req esessuib', errors[i], req.session);
							req.flash('error', errors[i].message);
						};
						console.log("req.session", req.session);
						res.redirect('/install/site');
						return;
					}
					user.save(function(err) {
						if (err) {
							req.flash('error', 'We get an error trying to save to the database. Do we have write access?');
							res.redirect('/install/database');
							return;
						}
						// TODO: SETUP BLOG TYPE HERE req.body['home']
						req.login(user, function(err) {
							console.log('Logged in::',  req.user, err);
							var c = require('../config.json');
							c.installed = true;
							c.options.server.auto_reconnect = false;
							fs.writeFile(path.join(__dirname, '../', 'config.json'), JSON.stringify(c, null, '\t'), function(error){
								res.redirect('/install/done');
							});
						});
					});
				});
			}

			if (!!req.user && (!req.body['password_again'] || req.body['password_again'].length == 0)) {
				req.body['password'] = null;
				pass();
			} else {
				user.setPassword(req.body['password_again'], function(){
					pass();
				});
			}
			
		});
	});
});

router.get('/done', function(req, res, next) {
	req.data.optionLoader('title')(req, res, next);
}, function(req, res) {

	res.render('admin/install/done', { title: 'Install' });
});

module.exports = router;
