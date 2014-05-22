"use strict";

var _ = require('lodash');
var Backbone = require('backbone')

// Renderers are a way to display data in JSON format
// There are a few examples in this code base -- a good one is renderers/user.js
// and the user subdirectory.
// 
// Usage:
// res.data = order.render().content();
// next();

module.exports = Backbone.Model.extend({
  className: "BaseRenderer",

  initialize: function(object) {
    this.model = object.model;
  },

  // Shared common attributes that should be returned in the response
  // @return {object} key/value pairs of attributes
  common: function() {
    return {
      created: this.model.get('created'),
      updated: this.model.get('updated'),
      created_date: this.model.get('created_date'),
      updated_date: this.model.get('updated_date'),
      metadata: this.model.get('metadata'),
      description: this.model.get('description'),
      user_id: this.model.get('user_id'),
      version: this.model.get('version')
    };
  },


  // View specific attributes that should be returned in the response
  // @return {object} key/value pairs of attributes
  schema: function() {
    return {};
  },


  // Combined attributes from common and schema that should be returned in the response
  // @return {object} key/value pairs of attributes
  content: function() {
    return _.extend({}, this.common(), this.schema());
  }

});