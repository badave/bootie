var _ = require('lodash');
var express = require('express');

// Exposes 2 additional attributes
// routes - an array of mapped routes
// url - a string representing the base url with optional version
module.exports = function(options) {
  options = options || {};

  // Create a new express router
  var router = express.Router(options);

  // Array of active routes
  router.routes = [];

  // Base URL of the router with optional version
  router.url = "/";
  if (options.version) {
    router.url += options.version;
  }

  // Set of active routes
  var paths = {};

  // Each controller has a `routes` object
  // Automagically hook up all routes defined in controllers
  if (options.Controllers) {
    _.each(options.Controllers, function(Controller) {
      var controller = new Controller();
      var routes = controller.routes;

      _.each(routes, function(route, method) {
        _.each(route, function(routeOptions, path) {
          // If path/method has already been defined, skip
          if (paths[path] === method) {
            return;
          }

          // If no route action is defined, skip
          if (!routeOptions.action) {
            return;
          }

          // Hook up the route/path/method to the controller action and middleware
          router[method](path, controller.pre || [], routeOptions.middleware || [], controller.before || [], function(req, res, next) {
            routeOptions.action.call(controller, req, res, next);
          }, controller.after || [], controller.post || []);

          // Add route to set of active routes
          router.routes.push({
            url: router.url,
            method: method,
            path: path
          });

          // Set this path/method as being active
          paths[path] = method;
        });
      });
    });
  }

  return router;
};