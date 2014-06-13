"use strict";

// References
// ---
// https://github.com/jsantell/backbone-promised/blob/master/index.js

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

  // Flag to force all updates to be patches on `sync`
  updateUsingPatch: true,

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
  // key: [{inner_key: 'string'}]
  // key: ['model']
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

    // Whenever a model gets assigned a value for `idAttribute`
    // We clear out defaults because we assume this is an existing model in the db
    this.listenTo(this, 'change:' + this.idAttribute, function() {
      // Clear out all defaults
      this.clearDefaults();
    }.bind(this));
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


  _validate: function(attrs, options) {
    var valid = Backbone.Model.prototype._validate.apply(this, arguments);

    if (!valid) {
      return false;
    }

    // TODO: Perform `schema` validation here

    return true;
  },

  clearDefaults: function() {
    var defaultKeys = _.keys(_.result(this, 'defaults'));
    _.each(defaultKeys, function(defaultKey) {
      this.unset(defaultKey);
    }.bind(this));
  },

  // Do any request body sanitation here
  // TODO: support deep set
  setFromRequest: function(body) {
    // Set new attributes
    this.set(body);

    // To support a `patch` operation
    // We're gonna `default/extend` all existing attributes after the `set`
    var attrs = {};
    _.merge(attrs, this.previousAttributes(), this.attributes, body);
    this.attributes = attrs;
  },

  // Alias for `render`
  toResponse: function() {
    return this.render();
  },

  // Builds a response based on `schema` and the model
  // There is a flaw where if the schema doesn't match the database
  // For nested objects that don't exist 
  // it might throw a `Cannot read property of undefined` error
  buildResponse: function(schema, json) {
    var response = {};
    _.each(schema, function(val, key) {
      if (_.isArray(val)) {
        if (val.length === 0) {
          // Empty array
          response[key] = json[key];
        } else if (_.isString(val[0])) {
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
      } else if (_.isObject(val) && !_.isEmpty(val)) {
        response[key] = this.buildResponse(schema[key], json[key]);
      } else {
        response[key] = json[key];
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

  // Lifecycle methods
  // ---
  // Returns: Promise (this)

  beforeFetch: function() {
    return Promise.resolve(this);
  },

  afterFetch: function() {
    return Promise.resolve(this);
  },

  beforeCreate: function() {
    return Promise.resolve(this);
  },

  beforeUpdate: function() {
    return Promise.resolve(this);
  },

  afterCreate: function() {
    return Promise.resolve(this);
  },

  afterUpdate: function() {
    return Promise.resolve(this);
  },

  // Adds before/after fetch lifecycle methods
  // Returns: Promise (this)
  fetch: function() {
    var originalArguments = arguments;

    return this.beforeFetch.apply(this, originalArguments).bind(this).then(function() {
      return Backbone.Model.prototype.fetch.apply(this, originalArguments);
    }).then(function() {
      return this.afterFetch.apply(this, originalArguments);
    });
  },


  // Return a rejected promise if validation fails
  // Bubble up the `validationError` from Backbone
  save: function() {
    var originalArguments = arguments;

    var beforeFn, afterFn;
    if (this.isNew()) {
      beforeFn = this.beforeCreate;
      afterFn = this.afterCreate;
    } else {
      beforeFn = this.beforeUpdate;
      afterFn = this.afterUpdate;
    }

    return beforeFn.apply(this, originalArguments).bind(this).then(function() {
      var op = Backbone.Model.prototype.save.apply(this, originalArguments);
      if (!op) {
        return Promise.reject(this.validationError);
      }
      return op;
    }).then(function() {
      return afterFn.apply(this, originalArguments);
    });
  },



  // Transactions
  // Applies a boolean flag called `locked`
  lock: function() {
    if (this.get('locked')) {
      var err = new Error("Model already locked.");
      return Promise.reject(err);
    }

    this.set('locked', true);
    return this.save();
  },

  unlock: function() {
    if (!this.get('locked')) {
      return Promise.resolve(this);
    }

    this.set('locked', false);
    return this.save();
  },

  // Convert all nested objects into dot notation keypaths (for `$set` patch)
  objToPaths: function(obj) {
    var ret = {};
    var separator = '.';

    _.each(obj, function(val, key) {
      if (_.isObject(val) && !_.isArray(val) && !_.isEmpty(val)) {
        //Recursion for embedded objects
        var obj2 = this.objToPaths(val);

        for (var key2 in obj2) {
          var val2 = obj2[key2];

          ret[key + separator + key2] = val2;
        }
      } else {
        ret[key] = val;
      }
    }.bind(this));

    return ret;
  },

  // Tested and working with both shallow and deep keypaths
  get: function(attr) {
    if (!_.isString(attr)) {
      return undefined;
    }

    return this.getDeep(this.attributes, attr);
  },

  // Support dot notation of accessing nested keypaths
  getDeep: function(attrs, attr) {
    var keys = attr.split('.');
    var key;
    var val = attrs;
    var context = this;

    for (var i = 0, n = keys.length; i < n; i++) {
      // get key
      key = keys[i];

      // Hold reference to the context when diving deep into nested keys
      if (i > 0) {
        context = val;
      }

      // get value for key
      val = val[key];

      // value for key does not exist
      // break out of loop early
      if (_.isUndefined(val) || _.isNull(val)) {
        break;
      }
    }

    // Eval computed properties that are functions
    if (_.isFunction(val)) {
      // Call it with the proper context (see above)
      val = val.call(context);
    }

    return val;
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

    // Force all `update` to actually be `patch` if configured
    if (this.updateUsingPatch && method === 'update') {
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
    // Convert all nested objects into paths so `$set` doesn't overwrite nested objects
    var obj = {
      "$set": this.objToPaths(attrs)
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