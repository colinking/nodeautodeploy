
'use strict'

/**
 * Require dependencies
 */
var express = require('express');
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
app.use(logger('dev'));

/**
 * Handle the deployment from GitHub
 */
app.post('/', function(req, res) {
	console.log(req.body);
	// Verify that the request is coming from GitHub
	
	// Get URL to check for more recent pushs to this branch
	
	// Get the branch that was commited to
	branch = req.body.ref;
	// Execute script to restart
	exec('~/scripts/autodeploy/tracker.sc');

	res.end();
});

/**
 * Start Express server.
 */
app.listen(app.get('port'), function() {
	console.log('Express server listening on port %d in %s mode', app.get('port'), app.get('env'));
});

module.exports = app;

