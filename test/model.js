/* globals describe, it, before, after */
"use strict";

var _ = require('lodash');
var should = require("chai").should();
var Model = require("../model");
var Mongo = require("../mongo");

describe("Models", function() {

  // Local variables
  var savedId;

  // Before
  // Connect to mongodb

  before(function(done) {
    Model.prototype.urlRoot = "test_models";
    
    Model.prototype.validate = function(attributes, options) {
      if (attributes.name === "Jack Dagnels") {
        return new Error("You Shall Not Pass!");
      } else {
        return false;
      }
    };


    var db = new Mongo("mongodb://localhost:27017/test");
    db.connect();
    db.on("connect", function(url) {
      Model.prototype.db = db;
      Model.prototype.db.eraseCollection("models");
      done();
    });
  });


  // Save

  it("should save with create and events", function(done) {
    var model = new Model({
      cid: _.random(1, 65535),
      name: "Pedro Sanchez"
    });

    var requestEventFired = false;

    model.on("request", function(model, op, options) {
      requestEventFired = true;
    });

    model.on("sync", function(model, resp, options) {
      done();
    });

    model.save(null, {
      success: function(model, resp, options) {
        requestEventFired.should.be.true;
        model.attributes.should.not.be.empty;
        should.exist(model.id);

        savedId = model.id;
      }
    });
  });

  it("should not save with create and validate and invalid and events", function(done) {
    var model = new Model({
      cid: _.random(1, 65535),
      name: "Jack Dagnels"
    });

    model.on("invalid", function(model, error, options) {
      (error instanceof Error).should.be.true;
      done();
    });

    model.save();
  });

  it("should save with update", function(done) {
    var model = new Model({
      _id: savedId,
      name: "Hugh Bowner"
    });
    model.save(null, {
      success: function(model, resp, options) {
        model.attributes.should.not.be.empty;
        should.exist(model.id);
        model.get("name").should.equal("Hugh Bowner");
        done();
      }
    });
  });

  it("should save with patch", function(done) {
    var model = new Model({
      _id: savedId,
      email: "hughbowner@gmail.com"
    });
    model.save(null, {
      patch: true,
      success: function(model, resp, options) {
        model.attributes.should.not.be.empty;
        should.exist(model.id);
        model.get("name").should.equal("Hugh Bowner");
        model.get("email").should.equal("hughbowner@gmail.com");
        done();
      }
    });
  });


  // Fetch

  it("should fetch", function(done) {
    var model = new Model({
      _id: savedId
    });
    model.fetch({
      success: function(model, resp, options) {
        // console.log(resp)
        model.get("name").should.equal("Hugh Bowner");
        model.get("email").should.equal("hughbowner@gmail.com");
        done();
      }
    });
  });

  it("should fetch with promise", function(done) {
    var model = new Model({
      _id: savedId
    });
    model.fetch()
      .then(function(resp) {
        done();
      })
      .catch(function(err) {
        done();
      });
  });

  it("should fetch with promise with errors", function(done) {
    var model = new Model();
    model.fetch()
      .then(function(resp) {
        done();
      })
      .catch(function(err) {
        done();
      });
  });


  it("should fetch with no ID with errors", function(done) {
    var model = new Model();
    model.fetch({
      success: function(model, resp, options) {
        done();
      },
      error: function(model, resp, options) {
        resp.message.should.equal("No ID for Model");
        (resp instanceof Error).should.be.true;
        done();
      }
    }).catch(function(err) {
      // Promise rejects even if error callback fires
    });
  });

  it("should fetch with where with regex", function(done) {
    var model = new Model();
    model.fetch({
      where: {
        name: /Hugh bowner/i,
        email: "hughbowner@gmail.com"
      },
      success: function(model, resp, options) {
        // console.log(resp)
        model.get("name").should.equal("Hugh Bowner");
        model.get("email").should.equal("hughbowner@gmail.com");
        done();
      }
    });
  });


  // Delete

  it("should delete", function(done) {
    var model = new Model({
      _id: savedId
    });
    model.destroy({
      success: function(model, resp, options) {
        resp.should.be.equal(1);
        done();
      }
    });
  });


  // After

  after(function(done) {
    done();
  });

});