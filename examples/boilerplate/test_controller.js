var Bootie = require('bootie');

var filed = require('filed');
var basename = require('path').basename;

module.exports = Bootie.Controller.extend({
  className: "TestController",

  setupRoutes: function() {
    this.routes.get["/test"] = {
      action: this.testGet,
      middleware: []
    };

    this.routes.post["/test"] = {
      action: this.testPost,
      middleware: []
    };

    this.routes.put["/test"] = {
      action: this.testPut,
      middleware: []
    };

    this.routes.delete["/test"] = {
      action: this.testDelete,
      middleware: []
    };

    this.routes.get["/file"] = {
      action: this.sendFile,
      middleware: []
    };
  },

  testGet: function(req, res, next) {
    res.json(200);
  },

  testPost: function(req, res, next) {
    res.json(200);
  },

  testPut: function(req, res, next) {
    res.json(200);
  },

  testDelete: function(req, res, next) {
    res.json(200);
  },

  sendFile: function(req, res, next) {
    var file = "index.html";
    var uri = __dirname  + "/public/" + file;
    res.setHeader('Content-Disposition', 'attachment; filename=\"'+basename(uri)+'\"');
    filed(uri).pipe(res);
  }

});