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
  className: "CrudController",
  debug: true,

  // The mongodb collection name
  urlRoot: 'models',

  model: Model,
  collection: Collection,

  // Available controller actions (see `setupRoutes` for more info)
  crud: ["C", "R", "O", "U", "D"],

  initialize: function() {
    // Make sure to call `super` as a best practice when overriding
    Controller.prototype.initialize.call(this);

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
            middleware: [this.requireUser, this.requireJSON]
          };
          break;
        case 'R':
          // Find
          this.routes.get[basePath] = {
            action: this.find,
            middleware: [this.requireUser]
          };
          break;
        case 'O':
          // FindOne
          this.routes.get[basePath + "/:id"] = {
            action: this.findOne,
            middleware: [this.requireUser]
          };
          break;
        case 'U':
          // Update
          this.routes.put[basePath + "/:id"] = {
            action: this.update,
            middleware: [this.requireUser, this.requireJSON]
          };
          break;
        case 'D':
          // Destroy
          this.routes.delete[basePath + "/:id"] = {
            action: this.destroy,
            middleware: [this.requireUser]
          };
          break;
        default:
          break;
      }
    }.bind(this));
  },

  // TODO this should probably move to base controller
  setupPreMiddleware: function() {
    this.pre.push(this.authenticateUser);
  },

  authenticateUser: function(req, res, next) {
    // This is the ideal place to authenticate the user with the db
    // and set `req.user` and optionally `req.admin`
    next();
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

  setupModel: function(req) {
    var model = new this.model();
    model.db = this.database.mongo;

    // If an `id` is provided, set it to the model
    if (req.params.id) {
      model.set(this.model.prototype.idAttribute, req.params.id);
    }

    // If the authenticated user is not godmode, set `user_id` to restrict queries
    if (req.user && !req.god) {
      model.set(this.model.prototype.userIdAttribute, req.user.id);
    }

    return model;
  },

  setupCollection: function(req, qo) {
    var collection = new this.collection();
    collection.db = this.database.mongo;

    // If the authenticated user is not godmode, set `user_id` to restrict queries
    if (req.user && !req.god) {
      qo.query[collection.model.prototype.userIdAttribute] = req.user.id;
    }

    return collection;
  }

});