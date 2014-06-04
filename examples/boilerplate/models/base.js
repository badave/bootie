"use strict";

var Bootie = require('bootie');

module.exports = Bootie.Model.extend({
  baseDefaults: function() {
    return {
      _id: null,
      user_id: null,
      created: (new Date()).getTime(),
      updated: (new Date()).getTime(),
      created_date: new Date(),
      updated_date: new Date(),
      metadata: {},
      version: 'v2'
    };
  },
  
  baseSchema: function() {
    return {
      _id: String,
      user_id: String,
      created: Number,
      updated: Number,
      created_date: Date,
      updated_date: Date,
      metadata: Object,
      version: String
    };
  }
});