"use strict";

var Bootie = require('bootie');
var BaseCollection = require('./base');
var TestModel = require('../models/test');

module.exports = BaseCollection.extend({
  className: "TestCollection",

  model: TestModel
  
});