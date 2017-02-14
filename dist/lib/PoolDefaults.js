'use strict';
/**
 * Create the default settings used by the pool
 *
 * @class
 */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PoolDefaults = function PoolDefaults() {
  _classCallCheck(this, PoolDefaults);

  this.fifo = true;
  this.priorityRange = 1;

  this.testOnBorrow = false;
  this.testOnReturn = false;

  this.autostart = true;

  this.evictionRunIntervalMillis = 0;
  this.numTestsPerEvictionRun = 3;
  this.softIdleTimeoutMillis = -1;
  this.idleTimeoutMillis = 30000;

  // FIXME: no defaults!
  this.acquireTimeoutMillis = null;
  this.maxWaitingClients = null;

  this.min = null;
  this.max = null;
  // FIXME: this seems odd?
  this.Promise = Promise;
};

module.exports = PoolDefaults;