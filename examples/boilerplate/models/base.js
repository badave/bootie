"use strict";

var Bootie = require('bootie');

module.exports = Bootie.Model.extend({
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