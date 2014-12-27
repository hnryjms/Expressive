var express = require('express');
var path = require('path');
var logger = require('morgan');
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
var data = new Data();
app.set('data', data);
var extend = new Extend(app);

app.__proto__.__proto__ = new Actions(app);

passport.use(data.passport());
passport.serializeUser(data.serializeUser());
passport.deserializeUser(data.deserializeUser());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());
app.use(data.session());
app.use(csrf());
app.use(passport.initialize());
app.use(passport.session());

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

if (app.get('env') == 'development') {
    app.use(logger('dev'));
    app.use(requireMiddleware({
        src: path.join(__dirname, 'public'),
        dest: path.join(__dirname, 'build'),
        build: true,
        debug: true,
        modules: jsModules
    }));
} else {
    app.use(requireMiddleware({
        src: path.join(__dirname, 'public'),
        dest: path.join(__dirname, 'build'),
        build: true,
        once: true,
        modules: jsModules
    }));
}

app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'public')));

// expressive setup
app.use(flash());
for (var engine in data.engines) {
    debug('Adding alternate view engine %s', engine);
    app.engine(engine, data.engines[engine]);
}

app.use(function(req, res, next) {
    var config = Config.database();

    app._prepare(req, res);
    req.data = data;
    req.passport = passport;
    res.locals.config = config;
    res.locals.options = {};
    res.locals.req = req;
    res.locals._expNavMatches = function(active, item) {
        return  active &&
                item &&
                (
                    (typeof item == 'string' && active == item) ||
                    (item instanceof RegExp && active.match(item))
                );
    }
    res.locals.enqueuedHeader = [];
    if (req.user) {
        res.locals.me = req.user
        
        // TODO: Change admin bar pieces as the users role changes
        res.locals.adminBar = app._generateAdminBar(req.user);
    }
    if (data.is.connected && data.is.configured) {
        next();
    } else if (!data.is.configured) {
        if (req.url.match(/^\/install/)) {
            next();
        } else {
            debug('Initializing installation');
            res.redirect('/install');
        }
    } else {
        debug('MongoDB is down! Attempting to reconnect. (State %d)', data._connection.readyState);
        data.try(function(err) {
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
