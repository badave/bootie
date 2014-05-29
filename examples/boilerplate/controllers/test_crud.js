"use strict";

var Bootie = require('bootie');
var BaseCrudController = require('./base_crud');
var TestModel = require('../models/test');
var TestCollection = require('../collections/test');

module.exports = BaseCrudController.extend({
  // All subclasses of crud controller need `urlRoot` defined
  urlRoot: 'tests',

  // All subclasses of crud controller need `model` and `collection` defined
  model: TestModel,
  collection: TestCollection,

  // An example of configuring several routes
  setupRoutes: function() {
    // Remember to call `super` because the crud route are automatically setup
    BaseCrudController.prototype.setupRoutes.call(this);
  }
  
});