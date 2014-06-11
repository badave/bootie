"use strict";

var _ = require('lodash');
var eyes = require('eyes');
var uuid = require('uuid');
var moment = require('moment');
var URLSafeBase64 = require('urlsafe-base64');
var crypto = require('crypto');

var mixin = module.exports = {};

// This mixes in several helper functions to `_`
_.extend(_, {
  uuid: uuid.v4,

  inspect: eyes.inspector({
    maxLength: 4096
  }),

  parseFloat: parseFloat,

  encodeBase64: function(str) {
    return URLSafeBase64.encode(new Buffer(str, 'utf-8'));
  },

  decodeBase64: function(str) {
    return URLSafeBase64.decode(str).toString('utf-8');
  },

  validateBase64: function(str) {
    return URLSafeBase64.validate(str);
  },

  isUnixTime: function(value) {
    if (value && value.toString().length > 11) {
      return false;
    }
    return true;
  },

  sanitizeEmail: function(email) {
    return email.trim().toLowerCase();
  },

  isValidEmail: function(email) {
    if (email && typeof(email) === "string" && email.length > 0 && email.match(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i)) {
      return true;
    } else {
      return false;
    }
  },

  isValidISO8601String: function(str) {
    // 2013-11-18T09:04:24.447Z
    // YYYY-MM-DDTHH:mm:ss.SSSZ
    return moment(str, 'YYYY-MM-DDTHH:mm:ss.SSSZ', true).isValid();
  },

  escapeRegExp: function(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  },

  fingerprintObject: function(object, algorithm) {
    algorithm = algorithm || 'sha1';
    return crypto.createHash(algorithm).update(JSON.stringify(object)).digest("hex").toString();
  },

  randomHash: function() {
    return crypto.createHash('sha256').update(this.uuid()).digest('hex');
  }
});