"use strict";

// What is BaseController?
// ---

// BaseController helps facilitate routing via express by providing controllers that react to route functions
// 
// For example, a route to `/users/:id` would be handled by a `UsersController` with function `findOne`
// 
// It provides a way for each controller to setup the routes and http methods it wants to respond to
// 
// Also provides a mechanism to define before and after middleware per controller
// 
// Finally, it also provides response and error handling default middleware

// **More documentation TBD**
// 
// An example configuration `routes.js` file
// (function() {
//   var Controllers = {};

//   Controllers.users = require('./controllers/users');
//   Controllers.orders = require('./controllers/orders');

//   _.each(Controllers, function(Controller) {
//     var controller = new Controller();
//     var routes = controller.routes;

//     _.each(routes, function(route, method) {
//       _.each(route, function(options, path) {
//         if (!options.action) {
//           return _.warn("route: [" + method + "]", path, ' is not defined');
//         }

//         app[method](path, controller.pre || [], options.middleware || [], controller.before || [], function(req, res, next) {
//           options.action.call(controller, req, res, next);
//         }, controller.after || [], controller.post || []);
//       });
//     });
//   });
// });

// TODO
// ---
// 2014/05/22 - Peter will add some comments

// Dependencies
// ---
var _ = require('lodash');
var Backbone = require('backbone');
var Model = require('./model');
var Collection = require('./collection');

module.exports = Backbone.Model.extend({
  className: "BaseController",

  path: "/",

  queryParams: function() {
    return {};
  },

  /** Called after the constructor */
  initialize: function() {
    // Routes
    this.routes = {
      get: {},
      post: {},
      put: {},
      delete: {}
    };

    // Middleware(s)
    this.pre = [];
    this.before = [];
    this.after = [];
    this.post = [];

    // Setup
    this.setupPreMiddleware();
    this.setupBeforeMiddleware();
    this.setupRoutes();
    this.setupAfterMiddleware();
    this.setupPostMiddleware();
  },

  /**
   * Computes the base path for the controller
   * @return {string} computed base path (i.e. http://localhost/v2)
   */
  basePath: function() {
    return this.path;
  },

  /**
   * Setup routes that this controller should handle
   */
  setupRoutes: function() {
  },

  setupPreMiddleware: function() {},
  setupPostMiddleware: function() {},

  /**
   * Setup middleware that should run before the route
   * i.e. this.before.push(this.fakeBeforeMiddleware.bind(this))
   */
  setupBeforeMiddleware: function() {},

  /**
   * Setup middleware that should run after the route
   * i.e. this.after.push(this.fakeAfterMiddleware.bind(this))
   */
  setupAfterMiddleware: function() {
    this.after.push(this.successResponse.bind(this));
    this.after.push(this.errorResponse.bind(this));
    this.after.push(this.finalResponse.bind(this));
  },


  /////////////
  // Helpers //
  /////////////

  /**
   * Parses req.query (querystring) for since/until, sort/order, skip/limit
   * Also builds a query using allowed queryParams if applicable
   */
  parseQueryString: function(req) {
    var query = {};
    var queries = [];
    var options = {};

    // Reserved Params
    var since = req.query.since || req.query.from; // validate timestamp (s or ms) [DO NOT USE]
    var until = req.query.until || req.query.to; // validate timestamp (s or ms) [ DO NOT USE]
    var sortBy = req.query.sort || "created"; // validate sortableParams
    var orderBy = req.query.order || "desc"; // validate [asc, desc]
    var skip = req.query.skip || req.query.offset || 0; // validate int
    var limit = req.query.limit || req.query.count || 50; // validate int

    // Build created, updated objects into the query string if sent in as dot notation
    _.each(req.query, function(obj, key) {
      var match;
      if (match = key.match(/(created|updated).(gte|lte|gt|lt)/)) {
        req.query[match[1]] = req.query[match[1]] || {};
        req.query[match[1]][match[2]] = parseInt(obj);
      }
    });

    var created = req.query.created || {}; // accepts both s and ms
    var updated = req.query.updated || {}; // accepts both s and ms

    // Convert all timestamps into integers
    _.each(created, function(timestamp, key) {
      created[key] = _.parseInt(timestamp);
    });

    _.each(updated, function(timestamp, key) {
      updated[key] = _.parseInt(timestamp);
    });

    // Query
    // Create date
    if (!_.isEmpty(created)) {
      var createdQuery = {
        created: {}
      };

      if (created.gte) {
        created.gte = _.isUnixTime(created.gte) ? created.gte * 1000 : created.gte;
        createdQuery.created["$gte"] = new Date(created.gte).getTime();
      } else if (created.gt) {
        created.gt = _.isUnixTime(created.gt) ? created.gt * 1000 : created.gt;
        createdQuery.created["$gt"] = new Date(created.gt).getTime();
      }

      if (created.lte) {
        created.lte = _.isUnixTime(created.lte) ? created.lte * 1000 : created.lte;
        createdQuery.created["$lte"] = new Date(created.lte).getTime();
      } else if (created.lt) {
        created.lt = _.isUnixTime(created.lt) ? created.lt * 1000 : created.lt;
        createdQuery.created["$lt"] = new Date(created.lt).getTime();
      }

      if (_.isNumber(created)) {
        created = _.isUnixTime(created) ? created * 1000 : created;
        createdQuery.created = new Date(created).getTime();
      }
      queries.push(createdQuery);
    }

    // Updated/modified date
    if (!_.isEmpty(updated)) {
      var updatedQuery = {
        updated: {}
      };

      if (updated.gte) {
        updated.gte = _.isUnixTime(updated.gte) ? updated.gte * 1000 : updated.gte;
        updatedQuery.created["$gte"] = new Date(updated.gte).getTime();
      } else if (updated.gt) {
        updated.gt = _.isUnixTime(updated.gt) ? updated.gt * 1000 : updated.gt;
        updatedQuery.updated["$gt"] = new Date(updated.gt).getTime();
      }

      if (updated.lte) {
        updated.lte = _.isUnixTime(updated.lte) ? updated.lte * 1000 : updated.lte;
        updatedQuery.updated["$lte"] = new Date(updated.lte).getTime();
      } else if (updated.lt) {
        updated.lt = _.isUnixTime(updated.lt) ? updated.lt * 1000 : updated.lt;
        updatedQuery.created["$lt"] = new Date(updated.lt).getTime();
      }

      if (_.isNumber(updated)) {
        updated = _.isUnixTime(updated) ? updated * 1000 : updated;
        updatedQuery.updated = new Date(updated).getTime();
      }
      queries.push(updatedQuery);
    }

    // Since/Until Range
    if (since || until) {
      var sinceUntilQuery = {
        created: {}
      };

      if (since) {
        sinceUntilQuery.created["$gte"] = new Date(_.parseInt(since) * 1000).getTime();
      }

      if (until) {
        sinceUntilQuery.created["$lte"] = new Date(_.parseInt(until) * 1000).getTime();
      }

      queries.push(sinceUntilQuery);
    }

    // Filter Params
    var allowedParams = _.extend(this.queryParams(), {
      "user_id": "string"
    });
    var queryParams = _.pick(req.query, _.keys(allowedParams));

    _.each(queryParams, function(val, key) {
      // If value is all, ignore this param
      if (val === 'all') {
        return;
      }

      // The built query filter
      var filter = {};

      // Get param type
      var type = allowedParams[key];

      // Deal with different param types
      if (type === 'regex') {
        // regex case insensitive and escaping special characters
        filter[key] = {
          "$regex": '^' + _.escapeRegExp(val),
          "$options": 'i'
        };
      } else if (type === 'string') {
        // strings and objectid
        filter[key] = val;
      } else if (type === 'integer') {
        // integers
        val = _.parseInt(val);
        filter[key] = val;
      } else {
        // invalid or unknown type
        return;
      }

      queries.push(filter);
    });

    // Combine the query
    if (queries.length > 0) {
      query['$and'] = queries;
    }


    // Options
    // Sort/Order/Limit/Skip
    var sortOptions = [
      [sortBy, orderBy]
    ];

    return {
      query: query,
      "sort": sortOptions,
      "limit": parseInt(limit, 10),
      "skip": parseInt(skip, 10)
    };
  },

  requireAdmin: function(req, res, next) {
    // TODO UserModel
    if (!req.admin) {
      var err = new Error("=== [ERROR] Unauthorized ===");
      err.code = 401;
      return next(err);
    }

    next();
  },

  requireUser: function(req, res, next) {
    // TODO UserModel
    if (!req.user) {
      var err = new Error("=== [ERROR] Unauthorized ===");
      err.code = 401;
      return next(err);
    }

    next();
  },

  requireJSON: function(req, res, next) {
    var err;
    if (!req.is('json')) {
      err = new Error("Please set your Request Headers to contain: Content-Type: application/json");
    }
    return next(err);
  },

  // Get access_token from req
  accessTokenFromRequest: function(req) {
    var access_token;

    if (req.headers.authorization) {
      // Use HTTP Auth header
      var parts = req.headers.authorization.split(' ');
      var scheme = parts[0];
      var credentials = parts[1];

      if (scheme === 'Basic') {
        // HTTP Basic
        var userPass = new Buffer(credentials, 'base64')
          .toString()
          .split(':');
        if (userPass.length > 1) {
          // Base64
          access_token = userPass[0];
        } else {
          // Not Base64
          access_token = credentials;
        }
      } else if (scheme === 'Bearer') {
        // HTTP Bearer
        access_token = credentials;
      } else {
        // Fallback if access_token is passed directly without scheme
        access_token = scheme;
      }
    } else if (req.query.access_token) {
      // Use query string
      access_token = req.query.access_token;
    }

    return access_token;
  },

  authenticate: function(req, res, next) {
    var UserModel = require('../models/v2/user');

    var access_token = this.accessTokenFromRequest(req);

    if (!access_token) {
      return next();
    }

    var user = new UserModel({
      access_token: access_token
    });

    user.fetch({
      require: true
    })
      .then(function() {
        req.user = user.attributes;
        // TODO Make UserModel
        req.user.id = user.attributes._id;
        req.user_model = user;

        if (user.get('admin')) {
          req.admin = true;

          if (req.query.iddqd) {
            req.god = true;
          }
        }

        _.info("User authenticated with email: %s and token: %s and admin: %s".green, user.get('email'), access_token, user.get('admin'));

        mixpanel.people.set(user.get('_id'), {
          "$ip": req.ip
        });

        return next();
      })
      .otherwise(function(err) {
        if (err === "Error: EmptyResponse") {
          return next();
        }

        // if there is an error, will catch
        return next(err);
      });
  },
  // Post route default middleware for handling successful responses
  successResponse: function(req, res, next) {
    var envelope = {};
    envelope.meta = {
      code: 200
    };

    // // Add Pagination header
    // if (res.paging) {
    //   // _.inspect(res.paging);
    //   res.set('Access-Control-Expose-Headers', 'X-CELERY-TOTAL, X-CELERY-COUNT, X-CELERY-LIMIT, X-CELERY-OFFSET, X-CELERY-HAS-MORE');
    //   res.set('X-CELERY-TOTAL', res.paging.total);
    //   res.set('X-CELERY-COUNT', res.paging.count);
    //   res.set('X-CELERY-LIMIT', res.paging.limit);
    //   res.set('X-CELERY-OFFSET', res.paging.offset);
    //   res.set('X-CELERY-HAS-MORE', res.paging.has_more);
    // }

    if (res.paging) {
      envelope.meta = {
        paging: res.paging
      };
    }

    envelope.data = res.data || {};

    res.data = envelope;
    next();
  },

  // Post route default middleware for handling error responses
  errorResponse: function(err, req, res, next) {
    res.code = res.code || err.code || 500;

    var envelope = {};
    res.data = res.data || {};

    envelope.meta = {};

    envelope.meta.error = {
      "message": err.message,
      "code": err.code
    };

    // To be backwards compatible with Celery, err.message should come back on data
    // This can be taken out in the near future when Celery's old dashboard is gone
    envelope.data = err.message;

    res.data = envelope;

    _.error("Controller Code: %d, Error: %s", res.code, err.message, err.stack);
    next();
  },

  // Final middleware for handling all responses
  finalResponse: function(req, res, next) {
    // If we timed out before managing to respond, don't send the response
    if (res.headerSent) {
      _.error("Request timed out before response was sent!");
      return;
    }

    res.code = res.code || 200;

    // Respond with correct format, defaulting to json
    res.fmt = res.fmt || 'json';
    if (res.fmt === 'json') {
      res.jsonp(res.code, res.data);
    } else if (res.fmt === 'xml') {
      res.set('Content-Type', 'application/xml; charset=utf-8');
      res.send(res.code, res.data);
    } else {
      // text or html
      res.send(res.code, res.data);
    }
  },

  ///////////////
  // Renderers //
  ///////////////
  renderModel: function(model) {
    return model.render()
      .content();
  },

  renderCollection: function(collection) {
    // TODO paging
    return collection.map(function(model) {
      return model.render()
        .content();
    });
  },

  renderContent: function(model) {
    return model.render()
      .content();
  },

  // Helpers
  // This method can be overridden to customize the response
  prepareResponse: function(modelOrCollection, req, res, next) {
    // console.log("\n=== BEGIN OUTPUT ===\n");
    // console.log(modelOrCollection);
    // console.log("\n=== END OUTPUT ===\n");
    if (!modelOrCollection) {
      return next();
    }

    if (modelOrCollection instanceof Model) {
      res.data = this.renderModel(modelOrCollection);
      res.resource = this.resource;
    } else if (modelOrCollection instanceof Collection || modelOrCollection instanceof Array) {
      res.data = this.renderCollection(modelOrCollection);
      res.resource = this.resources;
    } else if (modelOrCollection.toJSON) {
      _.info("Sending using toJSON for object: %s (please consider adding a renderer to the model or collection)", modelOrCollection.name);
      // TODO: arpan default this to base view, right now its a temp hack
      res.data = modelOrCollection.toJSON();
    }

    return next();
  },

  successHandler: function(req, res, next) {
    var that = this;
    return function(model) {
      // console.log("sending response *********************************************************");
      return that.prepareResponse(model, req, res, next);
    };
  },

  errorHandler: function(req, res, next) {
    var that = this;
    return function(err) {
      that.respondError(err, req, res, next);
    };
  },

  respondError: function(err, req, res, next) {
    var match, message;

    if (!err || err.message === "EmptyResponse") {
      err = new Error("Resource Not Found");
      err.code = 404;
    }

    if (/duplicate key value violates unique constraint/.test(err.message)) {
      message = "Resource must be unique";

      if (/sku/.test(err.message)) {
        message += ": SKU is a duplicate";
      } else if (/email/.test(err.message)) {
        message = "Email has already been taken";
      } else if (match = err.message.match(/duplicate key value violates unique constraint \"([a-zA-Z0-9\_]+)\"/)) {
        message += ": " + match[1];
      }

      err = new Error(message);
      err.code = 409;
    }

    if (/null value in column/.test(err.message)) {
      message = "Required field not specified";

      if (match = err.message.match(/null value in column \"([a-zA-Z0-9\_]+)\"/)) {
        message += ": " + match[1];
      }

      err = new Error(message);
      err.code = 412;
    }

    // mongodb errors
    if (/E11000 duplicate key error index/.test(err.message)) {
      message = "Resource must be unique";

      if (/email/.test(err.message)) {
        message = "Email has already been taken";
      }

      err = new Error(message);
      err.code = 409;
    }

    return next(err);
  }

});