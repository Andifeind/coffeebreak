module.exports = function(app, callback) {
	'use strict';

	var path = require('path'),
		fs = require('fs');

	var log = require('xqnode-logger');

	var coffeeBreakApp = require('../coffeebreak'),
		HTMLBuilder = require('../modules/htmlBuilder');

	app.get('/cbconf.json', function(req, res) {
		res.json(200, coffeeBreakApp.getPublicConf());
	});

	app.addRoute('get', '/', 'Show CoffeeBreak index page', function(req, res) {
		var projects = coffeeBreakApp.projects;
		console.log('Projects', projects);
		res.render('projectListing', {
			projects: projects
		});
	});

	app.addRoute('get', '/projects', 'Show CoffeeBreak projects overview page', function(req, res) {
		var projects = coffeeBreakApp.projects;
		console.log('Projects', projects);
		res.render('projectListing', {
			projects: projects
		});
	});

	app.get('/projects/:project', function(req, res) {
		res.redirect('./SpecRunner.html');
	});

	app.get('/projects/:project/SpecRunner.html', function(req, res) {
		//htmlBuilder.build('mocha-index');
		var projectName = req.param('project');
		log.dev('Got request in project ' + projectName, req.path);
		log.dev('Conf', coffeeBreakApp.coffeeBreak);

		if (coffeeBreakApp.projects[projectName]) {
			var conf = coffeeBreakApp.projects[projectName];
			var htmlBuilder = new HTMLBuilder(req, res);
			htmlBuilder.renderSpecRunner(conf);
		}
		else {
			res.render('projectNotFound', {
				project: projectName
			});
		}
	});

	app.get(/\/projects\/([a-zA-Z0-9_-]+)\/(.*)$/, function(req, res) {
		var projectName = req.params[0],
			conf = coffeeBreakApp.projects[projectName],
			file;

		file = path.join(conf.cwd, req.params[1]);
		fs.readFile(file, {
			encoding: 'utf8'
		}, function(err, source) {
			if (err) {
				log.error('Read static file failed!', err);
				res.send(500);
				return;
			}

			file = {
				name: file,
				type: path.extname(file).substr(1),
				source: source
			};
			
			coffeeBreakApp.taskRunner.runTasks('serve', conf, file, function() {

				if (file.file) {
					res.type(file.type);
					res.send(file[file]);
					return;
				}

				res.type(file.type);
				res.send(file.source);
			});
		});
	});

	app.get(/\/coverage\/([a-zA-Z0-9_-]+)\/(.*)$/, function(req, res) {
		var projectName = req.params[0],
			conf = coffeeBreakApp.projects[projectName],
			fileName = req.params[1],
			file;

		if (fileName === 'json-report') {
			fileName = 'coverage-final.json';
		}

		file = path.join(conf.tmpDir, 'coverage/html-cov', fileName);
		console.log('File', file);
		if (typeof file === 'object') {
			res.send(file[file]);
			return;
		}

		res.sendfile(file);
	});

	callback();
};