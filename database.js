"use strict";

// TODO
// ---
// 2014/05/22 - Peter will add some comments

// Dependencies
// ---
var _ = require('lodash');
var Backbone = require('backbone');
var redis = require('redis');
var Mongo = require('./mongo');

// DatabaseManager is a singleton that maintains the databases
module.exports = Backbone.Model.extend({
  className: "Database",
  debug: false,

  defaults: function() {
    return {
      mongo: {
        url: null
      },
      redis: {
        port: 6379,
        host: null,
        auth: null
      }
    };
  },

  initialize: function() {
    if (this.get('mongo').url) {
      this.setupMongo(this.get('mongo').url);
    }
    if (this.get('redis').host) {
      this.setupRedis(this.get('redis').port, this.get('redis').host, this.get('redis').auth);
    }
  },

  setupRedis: function() {
    var cache = redis.createClient(port, host);
    cache.auth(auth);
    this.redis = cache;

    if (this.debug) {
      console.log("Redis %d connected to url: %s@%:s", process.pid, auth, host + port)
    }
  },

  setupMongo: function(url) {
    this.mongo = new Mongo(url);
    this.mongo.name = url;
    this.setupEvents(this.mongo);
  },

  setupEvents: function(db) {
    db.on("connect", function(url) {
      if (this.debug) {
        console.log("Mongo %d connected to url: %s - %s", process.pid, url);
      }
    }.bind(this));

    db.on("error", function(error) {
      if (this.debug) {
        console.error("Mongo %d had an error at url: %s - %s", process.pid, url, error.message)
      }
    }.bind(this));
  }
});