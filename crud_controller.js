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

module.exports = Controller.extend({
  className: "CrudController",
  debug: false,

  // The mongodb collection name
  urlRoot: 'models',

  model: Model,
  collection: Collection,

  // Available controller actions (see `setupRoutes` for more info)
  crud: ["C", "R", "O", "U", "D"],

  // Base path appends `urlRoot`
  basePath: function() {
    return this.path + "/" + this.urlRoot;
  },

  // Sets up default CRUD routes
  // Adds `requireUser` middleware to all routes
  // Adds `requireJSON` middleware for post/put routes
  setupRoutes: function() {
    // Make sure to call `super` as a best practice when overriding
    Controller.prototype.setupRoutes.call(this);

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

  // CRUD functions
  find: function(req, res, next, options) {
    var collection = this.setupCollection(req);

    var qo = this.parseQueryString(req);
    qo.query[collection.model.prototype.userIdAttribute] = req.user.id;

    if (!_.isEmpty(options)) {
      _.extend(qo.query, options);
    }

    // If godmode is on, return list of ALL orders
    if (req.god) {
      delete qo.query[collection.model.prototype.userIdAttribute];
    }

    return collection.fetch(qo).bind(this).then(function() {
      return collection.count(qo).tap(function(total) {
        res.paging = {
          total: parseInt(total),
          count: parseInt(collection.models.length),
          limit: parseInt(qo.limit),
          offset: parseInt(qo.skip),
          has_more: parseInt(collection.models.length) < parseInt(total)
        };
      });
    }).then(this.nextThen(req, res, next)).catch(this.nextCatch(req, res, next));
  },

  findOne: function(req, res, next) {
    var model = this.setupModel(req);

    return model.fetch({
      require: true
    }).bind(this).tap(function(model) {
      if (model.get(model.userIdAttribute) !== req.user.id && !req.admin) {
        var err = new Error("Permission denied");
        err.code = 403;
        throw err;
      }
    }).then(this.nextThen(req, res, next)).catch(this.nextCatch(req, res, next));
  },

  create: function(req, res, next) {
    var model = this.setupModel(req);
    model.setFromRequest(req.body);

    return model.save().bind(this).then(this.nextThen(req, res, next)).catch(this.nextCatch(req, res, next));
  },

  update: function(req, res, next) {
    var model = this.setupModel(req);

    return model.fetch({
      require: true
    }).bind(this).then(function() {
      // checks to see if the user owns this model
      if (model.get(model.userIdAttribute) !== req.user.id && !req.admin) {
        var err = new Error("Permission denied");
        err.code = 403;
        throw err;
      }

      model.setFromRequest(req.body);
      return model.save();
    }).then(this.nextThen(req, res, next)).catch(this.nextCatch(req, res, next));
  },

  destroy: function(req, res, next) {
    var model = this.setupModel(req);

    return model.fetch({
      require: true
    }).bind(this).then(function() {
      return model.destroy({
        require: true
      }).then(this.nextThen(req, res, next));
    }).catch(this.nextCatch(req, res, next));
  },


  // Helpers
  // ---

  setupModel: function(req) {
    var model = new this.model();

    if (req.user) {
      model.user = req.user;
      model.set(this.model.prototype.userIdAttribute, req.user.id);
    }

    if (req.params.id) {
      model.set(this.model.prototype.idAttribute, req.params.id);
    }

    return model;
  },

  setupCollection: function(req) {
    var collection = new this.collection();

    if (req.user) {
      collection.user = req.user;
    }

    return collection;
  }

});