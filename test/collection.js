/* globals describe, it, before, after */
"use strict";

var _ = require('lodash');
var should = require("chai").should();
var Model = require("../model");
var Collection = require("../collection");
var Mongo = require("../mongo");

describe("Collections", function() {

  // Local variables
  var savedId;

  // Before
  // Connect to mongodb

  before(function(done) {
    var db = new Mongo("mongodb://localhost:27017/test");
    db.connect();
    db.on("connect", function(url) {
      Model.prototype.db = db;
      Collection.prototype.db = db;
      Collection.prototype.db.eraseCollection("models");
      done();
    });
  });

  before(function(done) {
    var modelOne = new Model({
      cid: 1,
      name: "Pedro Sanchez"
    });

    modelOne.save(null, {
      success: function(modelOne, resp, options) {
        var modelTwo = new Model({
          cid: 2,
          name: "Jack Dagnels"
        });

        modelTwo.save(null, {
          success: function(modelTwo, resp, options) {
            done();
          }
        });
      }
    });



  });

  // Fetch

  it("should fetch", function(done) {
    var collection = new Collection();
    collection.fetch({
      success: function(collection, resp, options) {
        collection.length.should.equal(2);
        (collection.at(0) instanceof Model).should.be.true;
        (collection.at(1) instanceof Model).should.be.true;
        collection.at(0).get("name").should.equal("Pedro Sanchez");
        collection.at(1).get("name").should.equal("Jack Dagnels");

        done();
      }
    });
  });

  it("should fetch with limit and skip", function(done) {
    var collection = new Collection();
    collection.fetch({
      limit: 1,
      skip: 1,
      success: function(collection, resp, options) {
        collection.length.should.equal(1);
        (collection.at(0) instanceof Model).should.be.true;
        collection.at(0).get("name").should.equal("Jack Dagnels");

        done();
      }
    });
  });

  it("should fetch with sort desc", function(done) {
    var collection = new Collection();
    collection.fetch({
      sort: [
        ["cid", "desc"]
      ],
      success: function(collection, resp, options) {
        collection.length.should.equal(2);
        collection.at(0).get("name").should.equal("Jack Dagnels");

        done();
      }
    });
  });

  it("should fetch with sort asc", function(done) {
    var collection = new Collection();
    collection.fetch({
      sort: [
        ["cid", "asc"]
      ],
      success: function(collection, resp, options) {
        collection.length.should.equal(2);
        collection.at(0).get("name").should.equal("Pedro Sanchez");

        done();
      }
    });
  });

  it("should fetch with where and regex", function(done) {
    var collection = new Collection();
    collection.fetch({
      where: {
        name: /pedro sanchez/i
      },
      success: function(collection, resp, options) {
        collection.length.should.equal(1);
        (collection.at(0) instanceof Model).should.be.true;

        done();
      }
    });
  });

  // After

  after(function(done) {
    done();
  });

});