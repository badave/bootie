/* globals describe, it, before, after */
"use strict";

var _ = require('lodash');
var Bootie = require('../index');
var should = require("chai").should();

describe("Mixins", function() {

  // Local variables
  var secretString = 'omg wtf bbq!';
  var encryptedString;

  // Before
  // Connect to mongodb

  before(function(done) {
    done();
  });


  it("should generate a random hash", function(done) {
    var randomHash = Bootie._.randomHash();
    randomHash.length.should.equal(64);
    done();
  });

  it("should generate an encrypted string", function(done) {
    encryptedString = Bootie._.encryptString(secretString);
    encryptedString.should.equal('6cca595aaffee6451e5c6d43451dfaa0');
    done();
  });

  it("should decrypt an encrypted string", function(done) {
    var decryptedString = Bootie._.decryptString(encryptedString);
    decryptedString.should.equal(secretString);
    done();
  });


  it("should sanitize an email", function(done) {
    var email = " lEeTh4x0R@tryCelery.com  ";
    var sanitizedEmail = Bootie._.sanitizeEmail(email);
    sanitizedEmail.should.equal('leeth4x0r@trycelery.com');
    done();
  });

  it("should validate an email", function(done) {
    var email = " lEeTh4x0R+spam@tryCelery.com  ";
    var sanitizedEmail = Bootie._.sanitizeEmail(email);
    Bootie._.isValidEmail(sanitizedEmail).should.be.true;
    done();
  });


  // After

  after(function(done) {
    done();
  });

});