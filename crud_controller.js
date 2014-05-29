"use strict";

// What is CrudController?
// ---

// CrudController helps making CRUD routing easy by providing a controller that automatically maps all CRUD routes
// 
// See documentation for [Controller](controller.html)

// TODO
// ---
// 2014/05/22 - Peter will add some comments

// Dependencies
// ---
var _ = require('lodash');
var Controller = require('./controller');
var Model = require("./model");
var Collection = require("./collection");
var Database = require("./database");

module.exports = Controller.extend({
  debug: true,

  // All subclasses of crud controller need `urlRoot` defined
  // The mongodb collection name
  urlRoot: 'models',

  // All subclasses of crud controller need `model` and `collection` defined
  model: Model,
  collection: Collection,

  // Available controller actions (see `setupRoutes` for more info)
  crud: ["C", "R", "O", "U", "D"],

  initialize: function() {
    // Make sure to call `super` as a best practice when overriding
    Controller.prototype.initialize.call(this);

    // Create a connection to the database for this controller
    // TODO should we use a shared connection across controllers instead?
    if (this.get('mongo')) {
      this.database = new Database({
        mongo: this.get('mongo')
      });
      this.database.mongo.connect().bind(this).then(function() {
        // Mongo connected
      }).catch(function(err) {
        // Mongo failed to connect
        if (this.debug) {
          console.log(err);
        }
      });
    }
  },

  // Base path appends `urlRoot`
  basePath: function() {
    return this.path + this.urlRoot;
  },

  // Sets up default CRUD routes
  // Adds `requireUser` middleware to all routes
  // Adds `requireJSON` middleware for post/put routes
  setupRoutes: function() {
    // Make sure to call `super` as a best practice when overriding
    Controller.prototype.setupRoutes.call(this);

    // Get the base url path
    var basePath = _.result(this, "basePath");

    // Setup CRUD routes
    _.each(this.crud, function(action) {
      switch (action) {
        case 'C':
          // Create
          this.routes.post[basePath] = {
            action: this.create,
            middleware: this.getMiddleware('create')
          };
          break;
        case 'R':
          // Find
          this.routes.get[basePath] = {
            action: this.find,
            middleware: this.getMiddleware('find')
          };
          break;
        case 'O':
          // FindOne
          this.routes.get[basePath + "/:id"] = {
            action: this.findOne,
            middleware: this.getMiddleware('findOne')
          };
          break;
        case 'U':
          // Update
          this.routes.put[basePath + "/:id"] = {
            action: this.update,
            middleware: this.getMiddleware('update')
          };
          break;
        case 'D':
          // Destroy
          this.routes.delete[basePath + "/:id"] = {
            action: this.destroy,
            middleware: this.getMiddleware('destroy')
          };
          break;
        default:
          break;
      }
    }.bind(this));
  },

  // CRUD functions
  // ---
  
  find: function(req, res, next, options) {
    var qo = this.parseQueryString(req);
    var collection = this.setupCollection(req, qo);

    // Override query
    if (options && options.query) {
      _.extend(qo.query, options.query);
    }

    return collection.fetch(qo).bind(this).then(function(resp) {
      return collection.count(qo).tap(function(resp) {
        res.paging = {
          total: parseInt(resp),
          count: parseInt(collection.models.length),
          limit: parseInt(qo.limit),
          offset: parseInt(qo.skip),
          has_more: parseInt(collection.models.length) < parseInt(resp)
        };
      });
    }).then(function(count) {
      return collection;
    }).then(this.nextThen(req, res, next)).catch(this.nextCatch(req, res, next));
  },

  findOne: function(req, res, next) {
    var model = this.setupModel(req);

    return model.fetch({
      require: true
    }).then(this.nextThen(req, res, next)).catch(this.nextCatch(req, res, next));
  },

  create: function(req, res, next) {
    var model = this.setupModel(req);
    model.setFromRequest(req.body);

    return model.save().bind(this).then(this.nextThen(req, res, next)).catch(this.nextCatch(req, res, next));
  },

  update: function(req, res, next) {
    var model = this.setupModel(req);
    model.setFromRequest(req.body);

    return model.save().bind(this).then(this.nextThen(req, res, next)).catch(this.nextCatch(req, res, next));
  },

  destroy: function(req, res, next) {
    var model = this.setupModel(req);

    return model.destroy().then(this.nextThen(req, res, next)).catch(this.nextCatch(req, res, next));
  },


  // Helpers
  // ---

  // Creates and returns a model
  // Checks for the existence of `id` in the url params
  // If there is an authenticated user, set the `user_id` attribute
  setupModel: function(req) {
    var model = new this.model();
    model.db = this.database.mongo;
    return model;
  },

  // Creates and returns a collection
  // If there is an authenticated user, add `user_id` to the query
  setupCollection: function(req, qo) {
    var collection = new this.collection();
    collection.db = this.database.mongo;
    return collection;
  }

});