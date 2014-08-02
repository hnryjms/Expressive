var express = require('express');
var router = express.Router({ strict: true });
var path = require('path');

router.get('/', function(req, res, next) {
	req.data.requireUser(req, res, req.data.optionLoader('title', 'maxRows'), next);
}, function(req, res) {
	var table = {
		plural: "accounts",
		singular: "account",
		addURL: "/admin/users/new",
		columns: [
			{
				title: 'Name',
				className: 'user-name',
				structure: '<a href="/admin/users/{{id}}">{{name.full}}</a>',
				actions: [
					{ url: '/admin/users/{{id}}', title: 'Edit' },
					{ url: '/admin/users/{{id}}/activate', title: 'Activate', if: function(row) { return row.active == false; } },
					{ url: '/admin/users/{{id}}/deactivate', title: 'Deactivate', className: 'text-danger', if: function(row) { return row.active == true && row.id != req.user.id; } }
				]
			}, { 
				title: 'Email',
				className: 'user-email',
				structure: '{{email}}'
			}
		]
	};
	var User = req.data.model('User');
	var page = req.query.page ? parseInt(req.query.page) : 1;
	User.paginate({}, page, req.options.maxRows, function(err, pages, users, items) {
		table.pagination = { pages: pages, page: page, items: items };
		table.data = users;
		res.render('admin/users', { title: 'Users', active: 'users', table: table });
	});
});

router.get('/new', function(req, res, next) {
	req.data.requireUser(req, res, req.data.optionLoader('title'), next);
}, function(req, res) {
	var User = req.data.model('User');
	var user = new User();
	res.render('admin/user', { title: 'New User', user: user, active: 'users/new', isNew: true });
});

router.post('/new', function(req, res, next) {
	req.data.requireUser(req, res, next);
}, function(req, res) {
	var User = req.data.model('User');
	var user = new User();

	user.name.first = req.body['name.first'];
	user.name.last = req.body['name.last'];
	user.email = req.body['email'];
	user.validateUser(null, function(err) {
		if (err) {
			req.flash('error', err.message);
			res.redirect('/admin/users/new');
		} else {
			user.save(function(err) {
				if (err) {
					req.flash('error', err.message);
					res.redirect('/admin/users/new');
				} else {
					res.redirect('/admin/users/' + user.id);
				}
			});
		}
	});
});

router.get('/:id', function(req, res, next) {
	req.data.requireUser(req, res, req.data.optionLoader('title'), next);
}, function(req, res) {
	var User = req.data.model('User');
	User.findById(req.params.id, function(err, user) {
		if (user) {
			res.render('admin/user', { title: user.name.full, active: 'users/' + user.id, user: user });
		} else {
			res.redirect('/admin/users');
		}
	});
});

router.get('/:id/deactivate', function(req, res, next) {
	req.data.requireUser(req, res, next);
}, function(req, res) {
	var User = req.data.model('User');
	
	User.findById(req.params.id, function(err, user) {
		if (user) {
			user.active = false;
			user.save(function(err) {
				req.flash('success', 'This account has been deactivated. They will not be able to sign in.');
				res.redirect('/admin/users');
			});
		} else {
			res.redirect('/admin/users');
		}
	});
});
router.get('/:id/activate', function(req, res, next) {
	req.data.requireUser(req, res, next);
}, function(req, res) {
	var User = req.data.model('User');
	
	User.findById(req.params.id, function(err, user) {
		if (user) {
			user.active = true;
			user.save(function(err) {
				req.flash('success', 'This account has been activated. They can now sign in.');
				res.redirect('/admin/users');
			});
		} else {
			res.redirect('/admin/users');
		}
	});
});

router.post('/:id', function(req, res, next) {
	req.data.requireUser(req, res, next);
}, function(req, res, next) {
	var User = req.data.model('User');

	User.findById(req.params.id, function(err, user) {
		if (user) {
			user.name.first = req.body['name.first'];
			user.name.last = req.body['name.last'];
			user.email = req.body['email'];
			
			if (user.id == req.user.id) {
				// USER is ME ----> Can change password

				var changePassword = false;
				if (req.body['new_password'] && req.body['new_password'].length > 0) {
					if (user.validatePassword(req.body['password'])) {
						user.password = req.body['new_password'];
						changePassword = true;
					} else {
						req.flash('error', 'You must enter your current password.');
						res.redirect('/admin/users/' + user.id);
						return;
					}
				}
			} else {
				// USER is not ME ----> Can deactivate, change role, etc.

				user.active = req.body['active'] == 'true';

				if (user.active && !user.password && !user.rid) {
					// Ask for a new password
				}
			}

			user.validateUser(changePassword ? req.body['new_password2'] : null, function(err) {
				if (err) {
					req.flash('error', err.message);
					res.redirect('/admin/users/' + user.id);
				} else {
					user.save(function(err) {
						req.flash('success', 'This account has been updated.');
						res.redirect('/admin/users/' + user.id);
					});
				}
			});
		} else {
			err = new Error("This user does not exist.");
			err.status = 500;
			next(err);
		}
	});
});

module.exports = router;