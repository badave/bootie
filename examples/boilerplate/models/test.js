"use strict";

var Bootie = require('bootie');
var BaseModel = require('./base');

module.exports = BaseModel.extend({
  className: "TestModel",

  urlRoot: "tests",

  publicAttributes: []

});