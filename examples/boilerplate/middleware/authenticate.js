"use strict";

module.exports = function(req, res, next) {
  req.user = new Bootie.Backbone.Model({
    _id: "52f437941c8aaaf2e426dc71",
    id: "52f437941c8aaaf2e426dc71",
    email: "jdagnels@gmail.com",
    name: "Jack Dagnels"
  });
  req.admin = true;
  req.god = true;
  next();
};