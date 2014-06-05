"use strict";

// Dependencies
// ---
var _ = require('lodash');
var Promise = require('bluebird');
var Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  debug: false,

  // mongodb id attribute, usually `_id`
  idAttribute: "_id",
  userIdAttribute: "user_id",

  // The mongodb collection name
  urlRoot: "models",

  // The defaults hash (or function) can be used to specify the default attributes for your model. 
  // When creating an instance of the model, 
  // any unspecified attributes will be set to their default value.
  // 
  // Remember that in JavaScript, objects are passed by reference, 
  // so if you include an object as a default value, 
  // it will be shared among all instances. 
  // Instead, define defaults as a function.
  // Object or Function
  // string: null
  // integer: 0
  // float: 0.0
  // boolean: true or false
  // object: {}
  // array: []
  defaults: function() {},

  // Defaults that should be applied to all models
  // Object or Function
  baseDefaults: function() {},

  // Define the types of each attribute
  // Object or Function
  // key: 'string'
  // key: 'integer'
  // key: 'float'
  // key: 'date'
  // key: {inner_key: 'string'}
  // key: ['string']
  schema: function() {},

  // Attributes that should be included in all responses
  // Object or Function
  baseSchema: function() {},

  // Instance properties
  // ---
  // `db`
  // `cache`

  constructor: function() {
    Backbone.Model.prototype.constructor.apply(this, arguments);

    // Apply `baseDefaults`
    _.defaults(this.attributes, _.result(this, 'baseDefaults'));    
  },

  initialize: function() {},

  // Copied from Backbone
  parse: function(resp, options) {
    // Mongodb `create` returns an array of one document
    if (_.isArray(resp)) {
      resp = resp[0];
    }
    return resp;
  },

  // Do any request body sanitation here
  setFromRequest: function(body) {
    this.set(body);
  },

  // Alias for `render`
  toResponse: function() {
    return this.render();
  },

  // Builds a response based on schema and the model
  buildResponse: function(schema, json) {
    var response = {};
    _.each(schema, function(val, key) {
      if (_.isArray(val)) {
        if (_.isString(val[0])) {
          // If the value for this key is an array of `Type`
          response[key] = json[key];
        } else {
          // If the value for this key is an array of `Object`
          response[key] = [];
          _.each(json[key], function(arrVal, arrKey) {
            response[key].push(this.buildResponse(val[0], arrVal));
          }.bind(this));
        }
      } else if (_.isString(val)) {
        response[key] = json[key];
      } else if (_.isObject(val)) {
        response[key] = this.buildResponse(schema[key], json[key]);
      }
    }.bind(this));
    return response;
  },

  render: function() {
    // If there is no schema defined, return all attributes
    var schema = _.result(this, 'schema');
    if (_.isEmpty(_.result(this, 'schema'))) {
      return this.toJSON();
    }

    // Merge the `baseSchema` with the defined `schema`
    _.merge(schema, _.result(this, 'baseSchema'));

    // Build the response
    var response = this.buildResponse(schema, this.toJSON());
    return response;
  },

  // TODO
  // https://github.com/jsantell/backbone-promised/blob/master/index.js
  // fetch: function(options) {
  //   return new Promise(function(resolve, reject) {
  //     resolve(Backbone.Model.prototype.fetch.call(this, options));
  //   }.bind(this));
  // },


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

    // Force all `update` to actually be `patch`
    if (method === 'update') {
      method = 'patch';
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
    return this.db.insert(this.urlRoot, model.toJSON(), this.wrapResponse(options)).return(this);
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

    return this.db.findAndModify(this.urlRoot, query, model.toJSON(), this.wrapResponse(options)).return(this);
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

    return this.db.findAndModify(this.urlRoot, query, obj, this.wrapResponse(options)).return(this);
  },

  // Removes a mongodb document
  // Must have ID
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
  // If `options.query` is provided and is an object,
  // it is used as the query
  read: function(model, options) {
    var query = {};
    if (_.isObject(options.query)) {
      // Build query
      query = options.query;
    } else {
      if (model.isNew()) {
        // If no ID in query, error out
        var err = new Error("No ID for Model");
        options.error(err);
        return Promise.reject(err);
      }

      // Build query against the model's id
      query[this.idAttribute] = model.id;
      if (model.has(this.userIdAttribute)) {
        query[this.userIdAttribute] = model.get(this.userIdAttribute);
      }
    }


    var mongoOptions = _.pick(options, ["require"]) || {};
    return this.db.findOne(this.urlRoot, query, mongoOptions, this.wrapResponse(options)).return(this);
  }

});