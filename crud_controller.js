"use strict";

// What is CrudController?
// ---

// CrudController helps making CRUD routing easy by providing a controller that automatically maps all CRUD routes
// 
// See documentation for [Controller](base_controller.html)

// TODO
// ---
// 2014/05/22 - Peter will add some comments

// Dependencies
// ---
var _ = require('lodash');
var Controller = require('./controller');

module.exports = Controller.extend({
  className: "CrudController",

  // Singular and Plural forms of the database table/collection
  resources: 'models',
  resource: 'model',

  model: null,
  collection: null,

  crud: ["C", "R", "O", "U", "D"],

  basePath: function() {
    return this.path + this.resources;
  },

  setupRoutes: function() {
    Controller.prototype.setupRoutes.call(this);

    var basePath = _.result(this, "basePath");

    // Setup CRUD routes
    _.each(this.crud, function(crud) {
      switch (crud) {
        case 'C':
          // Create
          this.routes.post[basePath] = {
            action: this.create,
            middleware: [this.requireUser.bind(this), this.requireJSON.bind(this)]
          };
          break;
        case 'R':
          // Find
          this.routes.get[basePath] = {
            action: this.find,
            middleware: [this.requireUser.bind(this)]
          };
          break;
        case 'O':
          // FindOne
          this.routes.get[basePath + "/:id"] = {
            action: this.findOne,
            middleware: [this.requireUser.bind(this)]
          };
          break;
        case 'U':
          // Update
          this.routes.put[basePath + "/:id"] = {
            action: this.update,
            middleware: [this.requireUser.bind(this), this.requireJSON.bind(this)]
          };
          break;
        case 'D':
          // Destroy
          this.routes.delete[basePath + "/:id"] = {
            action: this.destroy,
            middleware: [this.requireUser.bind(this)]
          };
          break;
        default:
          break;
      }
    }.bind(this));
  },

  requireJSON: function(req, res, next) {
    var err;
    // Enforce Content-Type: application/json for all POST and PUT requests
    if (!req.is('json')) {
      err = new Error("Please set your Request Headers to contain: Content-Type: application/json");
    }
    return next(err);
  },

  setupBeforeMiddleware: function() {
    Controller.prototype.setupBeforeMiddleware.call(this);
  },

  setupAfterMiddleware: function() {
    Controller.prototype.setupAfterMiddleware.call(this);
  },

  // CRUD functions
  find: function(req, res, next, options) {
    var collection = new this.collection();

    var qo = this.parseQueryString(req);
    qo.query.user_id = req.user_model.id;

    if (!_.isEmpty(options)) {
      _.extend(qo.query, options);
    }

    // If godmode is on, return list of ALL orders
    if (req.god) {
      delete qo.query.user_id;
    }

    return collection.fetch(qo)
      .bind(this)
      .then(function() {
        return collection.count(qo)
          .tap(function(total) {
            res.paging = {
              total: parseInt(total),
              count: parseInt(collection.models.length),
              limit: parseInt(qo.limit),
              offset: parseInt(qo.skip),
              has_more: parseInt(collection.models.length) < parseInt(total)
            };
          });
      })
      .then(function() {
        return collection;
      })
      .then(this.successHandler(req, res, next))
      .otherwise(this.errorHandler(req, res, next));
  },

  findOne: function(req, res, next) {
    var model = this.setupModel(req);

    return model.fetch({
      require: true
    })
      .tap(function(model) {
        if (model.get('user_id') !== req.user_model.id && !req.user_model.isAdmin()) {
          var err = new Error("Permission denied");
          err.code = 403;
          throw err;
        }
      })
      .then(this.successHandler(req, res, next))
      .otherwise(this.errorHandler(req, res, next));
  },

  create: function(req, res, next) {
    var model = this.setupModel(req);
    model.setFromRequest(req.body);
    return this.saveModel(model, req, res, next);
  },

  update: function(req, res, next) {
    var model = this.setupModel(req);

    return model.fetch({
      require: true
    })
      .then(function() {
        // checks to see if the user owns this model
        if (model.get('user_id') !== req.user_model.id && !req.user_model.isAdmin()) {
          var err = new Error("Permission denied");
          err.code = 403;
          throw err;
        }

        model.setFromRequest(req.body);
        // Save BaseModel
        return model.save();
      })
      .then(this.successHandler(req, res, next))
      .otherwise(this.errorHandler(req, res, next));
  },

  // Save model
  saveModel: function(model, req, res, next) {
    return model.save()
      .then(this.successHandler(req, res, next))
      .otherwise(this.errorHandler(req, res, next));
  },

  destroy: function(req, res, next) {
    var model = this.setupModel(req);

    return model.fetch({
      require: true
    })
      .bind(this)
      .then(function() {
        // Create model instance
        return model.destroy({
          require: true
        })
          .then(this.successHandler(req, res, next));
      })
      .otherwise(this.errorHandler(req, res, next));
  },


  ///////////////////////
  // BEFORE MIDDLEWARE //
  ///////////////////////

  setupModel: function(req) {
    var model = new this.model();

    if (req.user) {
      model.user = req.user;
      // TODO Make UserModel
      model.setUserId(req.user.id);
    }

    if (req.params.id) {
      model.setId(req.params.id);
    }

    return model;
  },

  setupCollection: function(req) {
    var collection = new this.collection();

    if (req.user) {
      collection.user = req.user;
      // TODO Make UserModel
      collection.setUserId(req.user.id);
    }

    return collection;
  }

});