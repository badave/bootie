"use strict";

// Dependencies
// ---
// Depends on `config` to be a global variable

// Module
// ---
// Only used by V2
// All your modules are belong to us.
// Export to global
var Bootie = {};

Bootie.Backbone = require('backbone');
Bootie._ = require('lodash');

// Database manager
// Bootie.Database = require('./database');
// Bootie.dbs = new Bootie.Database();
// Bootie.dbs.primary.connect();

// All external libraries
// ---

Bootie.Router = require('./router');

// PeeGee is the Postgres database driver.
// [Annotated Source](peegee.html)
// Bootie.PeeGee = PeeGee;

// Model is the Base Model for the ORM.
// [Annotated Source](model.html)
Bootie.Model = require('./model');

// Collection is the Base Collection for the ORM.
// [Annotated Source](collection.html)
Bootie.Collection = require('./collection');

// Base Controller for the router.
// [Annotated Source](base_controller.html)
Bootie.Controller = require('./controller');

// Crud Controller, extends Base Controller, adds CRUD routing.
// [Annotated Source](crud_controller.html)
Bootie.CrudController = require('./crud_controller');

// Adapters connect to third-party APIs and services.
// [Annotated Source](adapter.html)
Bootie.Adapter = require('./adapter');

// Renderers are the best
Bootie.Renderer = require('./renderer');

// Errors dawg.
// [Annotated Source](error.html)
Bootie.Error = require('./error');



// Queue processor (iron.io)
Bootie.Queue = require('./queue');

// Queue jobs
Bootie.Job = require('./job');



// Mixin Backbone.Events so that Bootie can be a pubsub bus
Bootie._.extend(Bootie.prototype, Bootie.Backbone.Events, {
  VERSION: '0.1.5'
});

// Export to the world
module.exports = Bootie;