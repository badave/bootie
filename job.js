"use strict";

// TODO
// ---
// 2014/05/22 - Peter will add some comments

// Dependencies
// ---
var _ = require('lodash');
var Backbone = require('backbone');
var fs = require("fs");
var hbs = require("hbs");

module.exports = Backbone.Model.extend({
  // This is relative to the CWD (node project root directory)
  templatesDir: './templates/mailers',

  initialize: function() {},

  lookupURL: function(order) {
    return new hbs.SafeString(config.frontend_url_v2 + '/status?number=' + (order.number || order.id) + '&email=' + order.buyer.email);
  }
});