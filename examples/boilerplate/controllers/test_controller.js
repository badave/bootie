"use strict";

var Bootie = require('bootie');
var filed = require('filed');
var basename = require('path').basename;

module.exports = Bootie.Controller.extend({
  className: "TestController",

  // An example of configuring several routes
  setupRoutes: function() {
    this.routes.get["/test"] = {
      action: this.testGet,
      middleware: []
    };

    this.routes.post["/test"] = {
      action: this.testPost,
      middleware: []
    };

    this.routes.put["/test"] = {
      action: this.testPut,
      middleware: []
    };

    this.routes.delete["/test"] = {
      action: this.testDelete,
      middleware: []
    };

    this.routes.get["/middleware"] = {
      action: this.testMiddleware,
      middleware: [this.testRouteMiddleware]
    };

    this.routes.get["/file"] = {
      action: this.sendFile,
      middleware: []
    };
  },

  setupPreMiddleware: function() {
    this.pre.push(this.testPreMiddleware);
  },

  setupBeforeMiddleware: function() {
    this.before.push(this.testBeforeMiddleware);
  },

  setupAfterMiddleware: function() {
    this.after.push(this.testAfterMiddleware);
  },

  testPreMiddleware: function(req, res, next) {
    console.log("Pre Middleware Ran");
    next();
  },

  testBeforeMiddleware: function(req, res, next) {
    console.log("Before Middleware Ran");
    next();
  },

  testAfterMiddleware: function(req, res, next) {
    console.log("After Middleware Ran");
    next();
  },

  testRouteMiddleware: function(req, res, next) {
    console.log("Route Middleware Ran");
    next();
  },

  testGet: function(req, res, next) {
    next();
  },

  testPost: function(req, res, next) {
    next();
  },

  testPut: function(req, res, next) {
    next();
  },

  testDelete: function(req, res, next) {
    next();
  },

  testMiddleware: function(req, res, next) {
    res.data = {
      message: "middleware test"
    };
    res.code = 201;
    next();
  },

  // Tells the browser to download the file instead of rendering it
  sendFile: function(req, res, next) {
    var file = "index.html";
    var uri = __dirname  + "/public/" + file;
    res.setHeader('Content-Disposition', 'attachment; filename=\"'+basename(uri)+'\"');
    filed(uri).pipe(res);
  }

});