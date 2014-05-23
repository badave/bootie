"use strict";

var Bootie = require('bootie');
var filed = require('filed');
var basename = require('path').basename;

var TestModel = require('../models/test_model');
var TestCollection = require('../collections/test_collection');

module.exports = Bootie.CrudController.extend({
  className: "TestCrudController",

  urlRoot: 'tests',

  model: TestModel,
  collection: TestCollection,

  // An example of configuring several routes
  setupRoutes: function() {
    // Remember to call `super` because the crud route are automatically setup
    Bootie.CrudController.prototype.setupRoutes.call(this);
  },

  // For testing purposes, override authenticateUser
  authenticateUser: function(req, res, next) {
    req.user = new Bootie.Backbone.Model({
      _id: "52f437941c8aaaf2e426dc71",
      email: "jdagnels@gmail.com",
      name: "Jack Dagnels"
    });
    next();
  },

});