"use strict";

var exec = require('child_process').exec;

exec('docco ./*.js -o docs', function(error, stdout, stderr) {
  console.log(stdout);
});