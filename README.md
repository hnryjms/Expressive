# Expressive

[![Build Status](https://travis-ci.org/brekkehj/Expressive.svg?branch=master)](https://travis-ci.org/brekkehj/Expressive)
[![Dependency Status](https://david-dm.org/brekkehj/Expressive.svg)](https://david-dm.org/brekkehj/Expressive)
[![devDependency Status](https://david-dm.org/brekkehj/Expressive/dev-status.svg)](https://david-dm.org/brekkehj/Expressive#info=devDependencies)
[![Coverage Status](https://coveralls.io/repos/brekkehj/Expressive/badge.png)](https://coveralls.io/r/brekkehj/Expressive)

Expressive is an awesome, beautiful CMS for [Express.js](http://expressjs.com) and [Node.js](http://nodejs.org). Expressive is extendable, themeable, testable and growing.

**Expressive is in a very unstable alpha state**

## Getting Started

Expressive is not ready for production use, but here is how you can start contributing to Expressive to bring the system to a stable release.

	$ npm install

The rest of the installation should be hooked into the postinstall process (bower install, etc), and should complete successfully.

To run Expressive, you have a number of options. My favorite is using [Nodemon](http://nodemon.io) to watch for changes. This repo even includes a `.nodemonignore` to make sure Nodemon watches the right files and ignores ones that don't matter (usually). **You also** need to make sure you have MongoDB available somewhere. The Expressive installer should guide you through connecting the database and setting up your first user.

	$ DEBUG=expressive:* node ./bin/www
	$ DEBUG=expressive:* npm start
	$ DEBUG=expressive:* nodemon

Once you're running, just open <http://localhost:3000/> and follow the setup guide. You'll need to have a MongoDB instance running. Once you're in, you can sign into the administration pages at <http://localhost:3000/admin>. *Most unfinished areas of Expressive will give you a 404 error.*

## Extensions

An example extension is included with Expressive, showing how awesome the extendability of Expressive is. Extensions are usually entirely separate Express apps with access to the parent app for hooking in their features.

**Much of Expressive's extendability is unfinished, and continuously changing**

*TODO:* Write better documentation.

## Contributing

Checkout the [Expressive GitHub Wiki](https://github.com/brekkehj/Expressive/wiki/Development) for more information about the development cycle.

To make contributions to Expressive, follow the steps below to get your changes in the CMS. My mission with Expressive is to build a largely *extendable* CMS, so try to write code that allows for some awesome extensions around it.

1. Fork the `brekkehj/Expressive` repo
1. Commit changes to your fork
1. Create a pull request back into Expressive
1. Win

Make sure to run & write tests for your cool things.

## Testing

We use the [mocha](http://visionmedia.github.io/mocha/) testing framework. To run tests, first install the module with development dependencies.

	$ npm install

You can run tests through npm or through mocha. Both will have the same result.

	$ npm test
	$ mocha test

## License

Expressive is available under the GNU GPL v3.0 License.

See the [LICENSE](https://github.com/brekkehj/Expressive/blob/master/LICENSE) for the more information about the GNU licence legal terms.
