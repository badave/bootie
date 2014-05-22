"use strict";

// http://www.devthought.com/2011/12/22/a-string-is-not-an-error/

// Parent Error
function BootieError(msg) {
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.message = msg;
  this.name = "BootieError";
}

BootieError.prototype.__proto__ = Error.prototype;

module.exports = BootieError;



// Child Errors
function DatabaseError(err, message) {
  BootieError.call(this, message);
  this.name = "DatabaseError";
  this.code = err.code;
  this.condition = err.message;
  this.detail = err.detail
}

DatabaseError.prototype.__proto__ = BootieError.prototype;


BootieError.DatabaseError = DatabaseError;