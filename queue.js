"use strict";

// TODO
// ---
// 2014/05/22 - Peter will add some comments

// Dependencies
// ---
var _ = require('lodash');
var Backbone = require('backbone');
var iron = require('iron_mq');

module.exports = Backbone.Model.extend({
  initialize: function() {
    if (!this.get('token') || !this.get('project_id') || !this.get('queue_name') || !this.get('jobs')) {
      _.warn("You are missing parameters...");
    }

    // Start the queue
    this.queue = new iron.Client({
      token: this.get('token'),
      project_id: this.get('project_id'),
      queue_name: this.get('queue_name')
    });

    this.processing = false;
  },

  // Add a job to the queue
  enqueue: function(jobName, data, callback) {
    var options = {
      body: null
    };
    try {
      options.body = JSON.stringify({
        name: jobName,
        data: data
      });
    } catch (err) {
      return callback(err);
    }

    this.queue.post(options, callback);
  },


  // Maintainence
  clearQueue: function(callback) {
    this.queue.clear(callback);
  },


  // Processing
  // This is done from the Worker process
  processJob: function(options) {
    options = options || {};

    this.queue.get(options, function(err, job) {
      // Execute job, then immediately try to get another
      if (job) {
        process.nextTick(function() {
          this.executeJob(job, function() {
            this.processJob(options);
          }.bind(this));
        }.bind(this));
        return;
      }

      // Error getting job
      if (err) {
        _.error("Error getting job from queue, error_message: %s", err.message);
      }

      // No job to process, wait 5s
      setTimeout(function() {
        this.processJob(options);
      }.bind(this), 5000);
    }.bind(this));
  },

  executeJob: function(job, callback) {
    // Parse job data
    var jobData;
    try {
      jobData = JSON.parse(job.body);
    } catch (err) {
      _.error("%s corrupt job: %s %j", this.className, job.id, job.body, {});
      return this.deleteJob(job, callback);
    }

    // Handle job
    var Klass = this.get('jobs')[jobData.name];
    if (!Klass) {
      _.error("%s corrupt job: %s %j", this.className, job.id, job.body, {});
      return this.deleteJob(job, callback);
    }

    var klass = new Klass();
    klass.perform(jobData.data, function(err) {
      if (err) {
        _.error("%s process job: %s (%s) attempt: %d error: %s", this.className, jobData.name, job.id, job.reserved_count, err.message);
        return this.releaseJob(job, callback);
      }

      _.info("%s process job: %s (%s) attempt: %d", this.className, jobData.name, job.id, job.reserved_count);
      this.deleteJob(job, function() {
        return callback();
      });
    }.bind(this));
  },

  deleteJob: function(job, callback) {
    var that = this;
    this.queue.del(job.id, function(err, body) {
      if (err) {
        _.error("%s delete job: %s %s %j", that.className, job.id, err.message, body, {});
      }
      _.info("%s delete job: %s %j", that.className, job.id, body, {});
      return callback();
    });
  },

  releaseJob: function(job, callback) {
    var that = this;
    // Delete after 3 days (72)
    if (job.reserved_count >= 10) {
      return this.deleteJob(job, callback);
    }

    var options = {
      delay: 3600
    };

    this.queue.msg_release(job.id, options, function(err, body) {
      if (err) {
        _.error("%s release job: %s %s %j", that.className, job.id, err.message, body, {});
      }

      _.info("%s release job: %s with delay: %dms", that.className, job.id, options.delay);
      return callback();
    });
  },
});