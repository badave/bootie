"use strict";

// Dependencies
// ---
var _ = require('lodash');
var Promise = require('bluebird');
var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  className: "Model",
  debug: false,

  // mongodb id attribute, usually `_id`
  idAttribute: "_id",

  // the mongodb connection object
  db: null,

  // the mongodb collection name
  urlRoot: "models",

  // Copied from Backbone
  parse: function(resp, options) {
    // Mongodb `create` returns an array of one document
    if (_.isArray(resp)) {
      resp = resp[0];
    }
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

  // Inserts a mongodb document
  create: function(model, options) {
    return this.db.insert(this.urlRoot, model.toJSON(), this.wrapResponse(options));
  },

  // Updates a mongodb document
  // NOTE: This replaces the entire document with the model attributes
  update: function(model, options) {
    // If no ID in query, error out
    if (model.isNew()) {
      var err = new Error("No ID for Model");
      options.error(err);
      return Promise.reject(err);
    }

    // Build query against the model's id
    var query = {};
    query[this.idAttribute] = model.id;

    return this.db.findAndModify(this.urlRoot, query, model.toJSON(), this.wrapResponse(options));
  },

  // Updates a mongodb document
  // NOTE: This sets only explicitly provided model attributes
  patch: function(model, options) {
    // If no ID in query, error out
    if (model.isNew()) {
      var err = new Error("No ID for Model");
      options.error(err);
      return Promise.reject(err);
    }

    // Build query against the model's id
    var query = {};
    query[this.idAttribute] = model.id;

    // Patch attributes with mongodb set
    var attrs = model.toJSON();
    delete attrs[this.idAttribute];

    // Use mongodb set to only update explicit attributes
    var obj = {
      "$set": attrs
    };

    return this.db.findAndModify(this.urlRoot, query, obj, this.wrapResponse(options));
  },

  // Removes a mongodb document
  delete: function(model, options) {
    // If no ID in query, error out
    if (model.isNew()) {
      var err = new Error("No ID for Model");
      options.error(err);
      return Promise.reject(err);
    }

    // Build query against the model's id
    var query = {};
    query[this.idAttribute] = model.id;

    return this.db.remove(this.urlRoot, query, this.wrapResponse(options));
  },

  // Finds a single mongodb document
  // If `options.where` is provided and is an object,
  // it is used as the query
  read: function(model, options) {
    var query = {};
    if (_.isObject(options.where)) {
      // Build query against where query
      query = options.where;
    } else {
      if (model.isNew()) {
        // If no ID in query, error out
        var err = new Error("No ID for Model");
        options.error(err);
        return Promise.reject(err);
      }

      // Build query against the model's id
      query[this.idAttribute] = model.id;
    }

    return this.db.findOne(this.urlRoot, query, this.wrapResponse(options));
  }

});