var express = require('express');
var router = express.Router({ strict: true });

var hat = require('hat');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

var users = require('./users');
var extensions = require('./extensions');

router.use('/users', users);
router.use('/extensions', extensions);

router.get('/', function(req, res, next) {
	req.data.requireOptions('title')(req, res, next);
}, function(req, res) {
	if (req.user) {
		res.render('admin/dashboard', { title: 'Dashboard', active: 'dashboard' });
	} else {
		res.redirect('/admin/login');
	}
});

router.get('/login', function(req, res, next) {
	req.data.requireOptions('title')(req, res, next);
}, function(req, res) {
	res.render('admin/login', { title: 'Login', next: req.query['next'] });
});

router.post('/login', function(req, res, next) {
	req.passport.authenticate('local', {
		successRedirect: req.body['next'] ? req.body['next'] : '/admin',
		failureRedirect: '/admin/login',
		failureFlash: true
	})(req, res, next);
});

router.get('/forgot', function(req, res, next) {
	req.data.requireOptions('title')(req, res, next);
}, function(req, res) {
	if (req.query.rid) {
		var User = req.data.model('User');

		User.findOne({ rid: req.query.rid }, function(err, user) {
			if (user) {
				res.render('admin/reset', { title: 'Reset Password', user: user });
			} else {
				req.flash('error', 'This reset link has expired.');
				res.redirect('/admin/forgot');
			}
		});
	} else {
		res.render('admin/forgot', { title: 'Reset Password' });
	}
});

router.post('/forgot', function(req, res, next) {
	req.data.requireOptions('title')(req, res, next);
}, function(req, res) {
	var User = req.data.model('User');

	if (req.body['rid'] && req.body['id']) {
		User.findOne({ _id: req.body['id'], rid: req.body['rid'] }, function(err, user) {
			if (user) {
				user.password = req.body['password'];
				if (req.body['password'] != req.body['password_again']) {
					user.invalidate("password", "Your passwords do not match.");
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
						res.redirect('/admin/forgot?rid=' + req.body['rid']);
						return;
					}

					res.redirect('/');
				});
			} else {
				req.flash('error', 'This reset link has expired.');
				res.redirect('/admin/forgot');
			}
		});
	} else {
		User.findOne({ email: req.body['email'] }, function(err, user) {
			if (user) {
				user.rid = hat();
				user.save(function(err) {
					fs.readFile(path.join(__dirname, '../', '../', 'views', 'email', 'reset.hbs'), 'utf8', function(err, mail) {
						var url = req.protocol + '://' + req.headers.host + '/admin/forgot?rid=' + user.rid;
						var message = req.data.hbs(mail)({
							user: user,
							url: url,
							options: req.options
						});
						console.log('Message::', message);
						req.data.mail(user.email, 'Reset Your ' + req.options.title + ' Password', message);

						req.flash('success', 'Check your email to finish resetting your password.');
						res.redirect('/admin/login');
					});
				});
			} else {
				req.flash('error', 'There is no account with that email.');
				res.redirect('/admin/forgot');
			}
		});
	}
});

router.get('/logout', function(req, res) {
	req.logout();
	req.flash('success', 'You have been logged out of your account.');
	res.redirect('/admin/login');
});

router.use(function(req, res, next) {
	var err = new Error("Not found");
	err.status = 404;
	next(err);
});

router.use(function(err, req, res, next) {
    if (err.status == 401 && !req.user) {
        res.redirect('/admin/login?next=' + encodeURIComponent(req.originalUrl));
    } else next(err);
});

router.use(function(err, req, res, next) {
	req.data.requireOptions('title')(req, res, function(){
		res.render('admin/error', {
			title: 'Error',
			message: err.message,
			error: err
		});
	});
});

module.exports = router;
