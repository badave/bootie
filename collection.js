"use strict";

// Dependencies
// ---
var _ = require('lodash');
var Backbone = require('backbone');
var Model = require("./model");

module.exports = Backbone.Collection.extend({
  className: "Collection",
  debug: false,

  // the mongodb connection object
  db: null,

  // the mongodb collection name
  model: Model,

  // Copied from Backbone, not currently overridden
  parse: function(resp, options) {
    return resp;
  },

  // Override the backbone sync method for use with mongodb
  // options contains 2 callbacks: `success` and `error`
  // Both callbacks have parameters (model, resp, options)
  // `resp` is either a `document` or an `error` object
  // 
  // Events
  // ---
  // A `request` event is fired before with parameters (model, op, options)
  // A `sync` event is fired after with parameters (model, resp, options)
  sync: function(method, model, options) {
    if (this.debug) {
      console.log("Sync called with method: %s", method);
    }
    var op = this[method].call(this, model, options);
    model.trigger("request", model, op, options);
    return op;
  },

  // Takes the mongodb response and calls the Backbone success method
  wrapResponse: function(options) {
    return function(err, resp) {
      if (err) {
        options.error(err);
      } else {
        options.success(resp);
      }
    };
  },

  // Finds mongodb documents
  read: function(model, options) {
    var query = {};

    // Build query against where query
    if (_.isObject(options.where)) {
      query = options.where;
    }

    // Build query with optional: limit, skip, sort
    var mongoOptions = _.pick(options, ["limit", "skip", "sort"]) || {};
    return this.db.find(this.model.prototype.urlRoot, query, mongoOptions, this.wrapResponse(options));
  }

});