"use strict";

var Bootie = require('bootie');
var TestModel = require('../models/test_model');

module.exports = Bootie.Collection.extend({
  className: "TestCollection",

  model: TestModel
  
});