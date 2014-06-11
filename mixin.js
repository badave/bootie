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

  // Encrypts a utf8 string into an encrypted hex string
  encryptString: function(str, algorithm, key) {
    algorithm = algorithm || 'aes256';
    // Obviously don't reuse this key
    key = key || '13741c7ec3a809950ed8e75c1abcfa0e8f9994b2b79d7a895c2e383f28c8a792';

    var cipher = crypto.createCipher(algorithm, key);
    cipher.update(str, 'utf8');
    return cipher.final('hex');
  },

  // Decrypts an encrypted hex string back into a utf8 string
  decryptString: function(str, algorithm, key) {
    algorithm = algorithm || 'aes256';
    // Obviously don't reuse this key
    key = key || '13741c7ec3a809950ed8e75c1abcfa0e8f9994b2b79d7a895c2e383f28c8a792';

    var decipher = crypto.createDecipher(algorithm, key);
    decipher.update(str, 'hex');
    return decipher.final('utf8');
  },

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