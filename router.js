var _ = require('lodash');
var express = require('express');

module.exports = function(options) {
  var router = express.Router(options);

  // Each controller has a `routes` object

  // Automagically hook up all routes defined in controllers
  _.each(options.Controllers, function(Controller) {
    var controller = new Controller();
    var routes = controller.routes;

    _.each(routes, function(route, method) {
      _.each(route, function(options, path) {
        if (options.action) {
          router[method](path, controller.pre || [], options.middleware || [], controller.before || [], function(req, res, next) {
            options.action.call(controller, req, res, next);
          }, controller.after || [], controller.post || []);
        }
      });
    });

  });

  return router;
};