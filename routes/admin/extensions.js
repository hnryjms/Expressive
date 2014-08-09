var express = require('express');
var router = express.Router({ strict: true });

var fs = require('fs');
var path = require('path');

router.get('/', function(req, res, next) {
	req.data.requireUser(req, res, req.data.requireOptions('title', 'maxRows'), next);
}, function(req, res) {
	fs.readdir(path.join(__dirname, '../', '../', 'private', 'extensions'), function(err, dirs) {
		var extensions = [];
		(function next(i) {
			if (i >= dirs.length) {

				var table = {
					plural: "extensions",
					singular: "extension",
					columns: [
						{
							title: 'Name',
							className: 'extension-name',
							structure: '{{#if title}}{{title}}{{else}}{{name}}{{/if}}',
						}, { 
							title: 'Description',
							className: 'extension-description',
							structure: '{{description}}'
						}
					],
					data: extensions
				};

				res.render('admin/extensions', { title: 'Extensions', active: 'extensions', table: table });
			} else {
				fs.readFile(path.join(__dirname, '../', '../', 'private', 'extensions', dirs[i], 'package.json'), 'utf8', function(err, json) {
					if (!err) {
						var extension = JSON.parse(json);
						extensions.push(extension);
					}
					next(++i);
				});
			}
		})(0);
	});
});

module.exports = router;