"use strict";

var Bootie = require('bootie');

module.exports = Bootie.Model.extend({
  className: "TestModel",

  urlRoot: "tests",

  privateAttributes: ['_id', 'user_id', 'created', 'updated', 'created_date', 'updated_date', 'metadata', 'description', 'version'],
  publicAttributes: [],

});