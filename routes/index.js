var express = require('express');
var router = express.Router({ strict: true });

var install = require('./install');
var admin = require('./admin');

router.use('/install', install);
router.use('/admin', admin);

module.exports = router;
