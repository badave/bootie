"use strict";

// TODO
// ---
// 2014/05/22 - Peter will add some comments

// Dependencies
// ---
var _ = require('lodash');
var redis = require('redis');
var Mongo = require('./mongo');

// DatabaseManager is a singleton that maintains the databases
var Database = module.exports = Air.Backbone.Model.extend({
  className: "Database",

  initialize: function() {
    this.setupMongo();
    this.setupRedis();
  },

  setupRedis: function() {
    var cache = redis.createClient(config.redis.cache.port, config.redis.cache.host);
    cache.auth(config.redis.cache.auth);
    this.redis_cache = cache;
  },

  setupMongo: function() {
    this.primary = new Mongo(config.mongodb.cujo);
    this.primary.name = "cujo_air";
    this.setupEvents(this.primary);
  },

  setupEvents: function(db) {
    db.on("connect", function(url) {
      // _.info("Mongo %d connected to url: %s - %s", config.pid, url, db.name);
    });

    db.on("error", function(error) {
      // _.warn("Mongo %d had an error: %s - %s", config.pid, error.message, db.name);
    });
  }
});