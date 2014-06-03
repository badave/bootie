"use strict";

// Dependencies
var _ = require('lodash');
var express = require('express');
var path = require('path');
var env = process.env['NODE_ENV'] || 'development';
var port = process.env['PORT'] || 1337;
var pid = process.pid;

// Middleware
var cors = require('cors');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');
var morgan  = require('morgan');
var favicon = require('serve-favicon');
var hbs = require('hbs');

// Bootie
var Bootie = require('bootie');




// Start express app
var app = express();
app.set('port', port);
app.enable('trust proxy'); // This lets req.ip show the real IP address on Heroku


// Config
var config = require('./config');
app.use(config.middleware);




// Middleware before Router

// Favicon
app.use(favicon(__dirname + '/public/favicon.ico'));

// Gzip compression (needs to be before static to compress assets)
app.use(compress());

// Logger
// app.use(morgan('dev'));
// Don't log 304
app.use(morgan({
  // format: 'dev',
  format: ':method :url :status - :remote-addr | :user-agent - :date - :response-time ms',
  skip: function(req, res) {
    return res.statusCode === 304;
  }
}));

// Enable CORS
app.use(cors());

// Support pseudo PUT/DELETE via headers
app.use(methodOverride());

// Static assets
var oneDay = 86400000;
var oneYear = 31536000000;
app.use(express.static(path.join(__dirname, '/public'), {
  maxAge: oneDay
}));

// Parse application/json and application/x-www-form-urlencoded
app.use(bodyParser());

// Parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));



// Database
// Connects to 2 mongo urls
var database = new Bootie.Database(config.database);

// Router
var TestController = require('./controllers/test');
var TestCrudController = require('./controllers/test_crud');

var router = new Bootie.Router({
  version: "v2",
  controllers: {
    test: new TestController(),
    test_crud: new TestCrudController({
      db: database.mongodbs.primary,
      cache: database.caches.primary
    })
  }
});
app.use(router.url, router);

_.each(router.routes, function(route) {
  console.log("Route: [%s] %s", route.method, route.url + route.path);
});

// Middleware after Router


// Start the HTTP server
var server = app.listen(app.get('port'), function() {
  console.log('Listening on port %d', server.address().port);
});