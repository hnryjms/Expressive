var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.use(function(req, res, next) {
	req.parent.addMenu('content', [
		{ title: 'Sample', href: '/admin/example' }
	]);
	req.parent.customField('User', {
		title: 'Sample Boolean',
		name: 'sample-bool',
		default: true,
		description: 'Sample description could go here.',
		type: Boolean
	});
	next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(function(req, res, next) {
	res.locals.parent = req.parent;
	next();
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/admin/example', routes);

module.exports = app;
