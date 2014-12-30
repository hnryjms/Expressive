var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var lessMiddleware = require('less-middleware');
var flash = require('connect-flash');
var passport = require('passport');
var csrf = require('csurf');
var requireMiddleware = require('requirejs-middleware');

var debug = require('debug')('expressive:app');

var routes = require('./routes/index');

var Data = require('./data');
var Extend = require('./extend');
var Actions = require('./actions');
var Config = require('./config');

var app = express();

app.use(function prepareData(req, res, next) {
	if (!app.get('data')) {
		var data = new Data(null, function(err){
			next();
		});
		app.set('data', data);
	} else {
		next();
	}
});

app.set('passport', passport);
var extend = new Extend(app);

app.__proto__.__proto__ = new Actions(app);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(cookieParser());
app.use(function sessionStore(req, res, next) {
	var data = app.get('data');

	data.session()(req, res, next);
});
app.use(function expCSRF(req, res, next) {
	if (app.get('env') != 'test') {
		csrf()(req, res, next);
	} else {
		req.csrfToken = function(){};
		next();
	}
});

var _dataInitialized = false;
app.use(function passportWare(req, res, next) {
	var passport = app.get('passport');

	if (!_dataInitialized) {
		_dataInitialized = true;
		var data = app.get('data');

		for (var engine in data.engines) {
			debug('Adding alternate view engine %s', engine);
			app.engine(engine, data.engines[engine]);
		}

		passport.use(data.passport());
		passport.serializeUser(data.serializeUser());
		passport.deserializeUser(data.deserializeUser());
	}

	passport.initialize()(req, res, function(){
		passport.session()(req, res, next);
	});
});

app.use(lessMiddleware(path.join(__dirname, 'private'), {
	dest: path.join(__dirname, 'public')
}));

var jsModules = {
	'/javascripts/account.js': {
		baseUrl: path.join(__dirname, 'public', 'resources'),
		include: '../javascripts/account',
		paths: {
			jquery: 'jquery/dist/jquery'
		}
	}
};

app.use(requireMiddleware({
	src: path.join(__dirname, 'public'),
	dest: path.join(__dirname, 'build'),
	build: true,
	debug: (app.get('env') == 'development'),
	once: (app.get('env') == 'production'),
	modules: jsModules
}));

app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'public')));

// expressive setup
app.use(flash());

app.use(function appPrepare(req, res, next) {
	app._prepare(req, res);
	if (req.data.is.connected && req.data.is.configured) {
		next();
	} else if (!req.data.is.configured) {
		if (req.url.match(/^\/install/)) {
			next();
		} else {
			debug('Initializing installation');
			res.redirect('/install');
		}
	} else {
		debug('MongoDB is disconnected. Trying again and then failing.');
		req.data.try(function(err) {
			if (!err) {
				next();
			} else {
				debug('MongoDB is offline.');
				var error = new Error("Please check your database configuration.");
				error.status = 500;
				next(error);
			}
		});
	}
});
app.use(extend.middleware());
app.use('/', routes);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

/// error handlers

app.use(extend.errorware());

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.locals.pretty = true;
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;
