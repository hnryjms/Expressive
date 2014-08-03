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
var fs = require('fs');
var watch = require('node-watch');

var routes = require('./routes/index');

var app = express();
var data = require('./data');
var debug = require('debug')('expressive:app');

var Actions = require('./actions.js');

app.__proto__.__proto__ = new Actions(app);

app.set('extensions', {});
data.once('ready', function(){
    fs.readdir(path.join(__dirname, 'private', 'extensions'), function(err, dirs) {
        var extensions = [];
        var loadExtension = function(extension) {
            debug('Loading extension "%s"...', extension);

            var EXT = require(extension);

            (function run(mod) {
                // Go over each of the module's children and
                // run over it
                mod.children.forEach(function (child) {
                    run(child);
                });

                // Call the specified callback providing the
                // found module
                delete(require.cache[mod.id]);
            })(require.cache[extension]);

            return EXT;
        }
        var next = function(i) {
            if (i >= dirs.length) {
                var index = i - dirs.length;
                if (index < extensions.length) {
                    var extension = path.join(__dirname, 'private', 'extensions', extensions[index]);
                    fs.exists(extension, function(exists) {
                        if (exists && true) {

                            var EXT = { middleware: loadExtension(extension) };
                            
                            EXT._path = path.join(extension, '../');
                            EXT._watcher = watch(path.join(extension, '../'), function(filename) {
                                if (filename.substr(-2) == 'js') {
                                    app.get('extensions')[extensions[index]].middleware = loadExtension(extension);

                                    debug('Extension "%s" has been updated and reloaded.', extensions[index]);
                                }
                            });

                            app.get('extensions')[extensions[index]] = EXT;
                        } else {
                            debug('Error with "%s" Extension (missing plugin file)', extensions[index]);
                        }
                        next(++i);
                    });
                }
            } else {
                fs.readFile(path.join(__dirname, 'private', 'extensions', dirs[i], 'package.json'), 'utf8', function(err, json) {
                    if (!err) {
                        var extension = JSON.parse(json);
                        extensions.push(path.join(dirs[i], extension.main || 'app.js'));
                        next(++i);
                    } else {
                        next(++i);
                    }
                });
            }
        };
        next(0);
    });
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(data.session());
app.use(csrf());
passport.use(data.passport());
passport.serializeUser(data.serializeUser());
passport.deserializeUser(data.deserializeUser());
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
    var config = require('./package.json').config || { options: {} };

    app._prepare(req, res);
    req.data = data;
    req.passport = passport;
    res.locals.config = config;
    res.locals.options = {};
    res.locals.req = req;
    res.locals.flash = function(type) {
        return req.flash(type);
    };
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
        res.locals.adminBar = {
            leftItems: [
                {
                    title: 'Dashboard',
                    active: 'dashboard',
                    href: '/admin'
                },
                {
                    id: 'content',
                    title: 'Content',
                    active: /^(posts|pages|media|themes|extensions|settings)/,
                    href: '/admin/posts',
                    submenu: [
                        {
                            id: 'content-sources',
                            items: [
                                {
                                    title: 'Posts',
                                    active: 'posts',
                                    href: '/admin/posts',
                                    new: '/admin/posts/new'
                                },
                                {
                                    title: 'Pages',
                                    active: 'pages',
                                    href: '/admin/pages',
                                    new: '/admin/pages/new'
                                },
                                {
                                    title: 'Media',
                                    active: 'media',
                                    href: '/admin/media',
                                    new: {
                                        href: '/admin/media/new',
                                        title: 'Add'
                                    }
                                }
                            ]
                        },
                        {
                            id: 'content-layout',
                            items: [
                                {
                                    title: 'Themes',
                                    active: 'themes',
                                    href: '/admin/themes'
                                },
                                {
                                    title: 'Extensions',
                                    active: 'extensions',
                                    href: '/admin/extensions'
                                }
                            ]
                        },
                        {
                            id: 'content-options',
                            items: [
                                {
                                    title: 'Manage Settings',
                                    active: 'settings',
                                    href: '/admin/settings'
                                }
                            ]
                        }
                    ]
                }
            ],
            rightItems: [
                {
                    title: req.user.name.full,
                    active: /^users/,
                    href: '/admin/users',
                    submenu: [
                        {
                            id: 'accounts',
                            items: [
                                {
                                    title: 'Edit Profile',
                                    active: 'users/' + req.user.id,
                                    href: '/admin/users/' + req.user.id,
                                },
                                {
                                    title: 'Accounts',
                                    active: 'users',
                                    href: '/admin/users',
                                    new: '/admin/users/new'
                                }
                            ]
                        },
                        {
                            id: 'right',
                            items: []
                        },
                        {
                            title: 'Logout',
                            href: '/admin/logout'
                        }
                    ]
                }
            ]
        }
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
app.use(function(req, res, next) {
    var middleware = Object.keys(app.get('extensions')).reduce(function(a, e) {
        e = app.get('extensions')[e];
        if (e.middleware) {
            var fn = e.middleware;
            fn._path = e._path;
            a.push(fn);
        }
        return a;
    }, []);
    var orig = req.app;
    (function pass(i) {
        if (i >= middleware.length) {
            next();
        } else {
            middleware[i](req, res, function(err) {
                req.__proto__ = orig.request;
                res.__proto__ = orig.response;
                if (err) {
                    next(err);
                } else {
                    pass(++i);
                }
            });
        }
    })(0);
});
app.use('/', routes);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(error, req, res, next) {
    var middleware = Object.keys(app.get('extensions')).reduce(function(a, e) {
        e = app.get('extensions')[e];
        if (e.middleware && e.middleware.length >= 4) {
            var fn = e.middleware;
            fn._path = e._path;
            a.push(fn);
        }
        return a;
    }, []);
    (function pass(i) {
        if (i >= middleware.length) {
            next(error);
        } else {
            middleware[i].parent = app;
            middleware[i].handle(error, req, res, function(err){
                if (err) {
                    // Change to new error
                    error = err;
                }
                pass(++i);
            });
        }
    })(0);
});

/// error handlers

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
