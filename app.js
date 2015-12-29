
'use strict'

/**
 * Require dependencies
 */
var express = require('express');
var bodyParser = require('body-parser');
var process = require('process');
var path = require('path');
var homedir = require('homedir');
var fs = require('fs');
var exec = require('child_process').exec;
var crypto = require('crypto');
var secrets = require('./config/secrets.conf');
var settings = require('./config/settings.conf');

/**
 * Create Express server.
 */
var app = express();

/**
 * Express configuration.
 */
app.set('port', 3500);
app.use(bodyParser.json());

/**
 * Handle the deployment from GitHub
 */
app.post('/', function(req, res) {
	// Verify that the request is coming from GitHub
	var hmac = crypto.createHmac('sha1', secrets.deploymentSecret);
	hmac.update(JSON.stringify(req.body));
	var calculatedSignature = 'sha1=' + hmac.digest('hex');
	
	if(req.headers['x-hub-signature'] === calculatedSignature) {
		// Get the branch that was commited to
		var branch_ref = req.body.ref;
		// Parse out any references from the front of the branch (ex. ref/head/master -> master)
		var branch;
		if (branch_ref.indexOf('/') > -1) {
			var branch_parts = branch_ref.split('/');
			branch = branch_parts[branch_parts.length - 1];
		} else {
			branch = branch_ref
		}
		// Get the repo that was commited to
		var repo_name = req.body.repository.name;
		console.log("Push made to repo: " + repo_name + " to branch: " + branch);
		// Get the path that this repo is hosted on, on this server
		var repo_data = settings.repos[repo_name];
		if (repo_data == undefined) {
			res.status(500).send('Repository (' + repo_name + ') not defined in settings');
		} else {
			var branch_data = repo_data[branch];
			if (branch_data != undefined) {
				// Get the path to this repo
				var home_path = homedir();
				if (branch_data.path && branch_data.pm2_id) {
					var full_path = home_path + "/" + branch_data.path;
					// Verify that the path exists
					fs.exists(full_path, function(exists) {
						if (exists) {
							process.chdir(full_path);
								// Figure out what branch is currently pulled at this file path
								exec('git rev-parse --abbrev-ref HEAD', function(err, live_branch) {
									if (err) res.status(500).send("An error occurred while fetching the live git branch: " + err);
									live_branch = live_branch.trim();
									if (live_branch == branch) {
										// Stop the pm2 for this repo, pull new code, start pm2 
										exec('pm2 stop ' + branch_data.pm2_id + ' && git pull && npm install; pm2 start ' + branch_data.pm2_id, function(err) {
											if(err) res.status(500).send("An error occurred while reloading the website: " + err);
											console.log("Successfully updated code for repo: " + repo_name + " on branch: " + branch);
											res.end();
										});
									} else {
										res.status(500).send('Live branch (' + live_branch + ') in repository (' + full_path + ') does not match branch in commit (' + branch + ')');
									}
								});
						} else {
							res.status(500).send('Path for repository (' + repo_name + ') does not exist (' + full_path + ')');
						}
					});
				} else {
					res.status(500).send('Repository (' + repo_name + ') not fully specified in config/settings.js');
				}
			} else {
				res.status(500).send('The ' + branch + ' branch has not been set up for this repo (' + repo_name + ')');
			}
		}
	} else {
		res.status(500).send('The payload hash does not match.');
	}
});

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
	console.log('Auto Deploy server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;

