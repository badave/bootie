"use strict";

// Dependencies
var _ = require('lodash');
var express = require('express');
var path = require('path');
var Bootie = require('bootie');

// Middleware
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');
var morgan  = require('morgan');
var favicon = require('serve-favicon');

// Express app
var app = express();
var env = process.env.NODE_ENV;


// Middleware before Router

// Favicon
app.use(favicon(__dirname + '/public/favicon.ico'));

// Gzip compression (needs to be before static to compress assets)
app.use(compress());

// Logger
// app.use(morgan('dev'));
app.use(morgan({
  // format: 'dev',
  format: ':method :url :status - :remote-addr | :user-agent - :date - :response-time ms',
  skip: function(req, res) {
    return res.statusCode === 304;
  }
}));

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
var database = new Bootie.Database({
  mongos: {
    primary: "mongodb://localhost:27017/test",
    secondary: "mongodb://localhost:27017/test"
  },
  // redis: {
  //   port: 6370,
  //   host: 'localhost'
  // }
});


// Router
var TestController = require('./controllers/test');
var TestCrudController = require('./controllers/test_crud');

var router = new Bootie.Router({
  version: "v2",
  controllers: {
    test: new TestController(),
    test_crud: new TestCrudController({
      db: database.secondary
    })
  }
});
app.use(router.url, router);

_.each(router.routes, function(route) {
  console.log("Route: [%s] %s", route.method, route.url + route.path);
});

// Middleware after Router


// Start the HTTP server
var server = app.listen(1337, function() {
  console.log('Listening on port %d', server.address().port);
});