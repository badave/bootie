"use strict";

var fs = require('fs');
var path = require('path');
var _ = require('lodash');

var pjson = require('../package.json');
var database = require('./database.json');

var config = module.exports = {
  proc: 'APP',
  pid: process.pid,
  env: process.env.NODE_ENV || 'development',
  cachebust: (new Date()).getTime() // timestamp when process was started
};

// Connect to databases if `database.json` exists
if (database) {
  config.database = database;
}

// Load/extend environment specific config file if it exists
var configFilename = path.join(__dirname, config.env + '.json');
if (fs.existsSync(configFilename)) {
  _.extend(config, require(configFilename));
}



// Maybe configure mixpanel here?

// Maybe configure loggers?




// Optional middleware to mix `config` into `req.config`
config.middleware = function(req, res, next) {
  req.config = _.omit(config, 'middleware');
  next();
};