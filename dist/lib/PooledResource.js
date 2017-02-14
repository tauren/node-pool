'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PooledResourceStateEnum = require('./PooledResourceStateEnum');

/**
 * @class
 * @private
 */

var PooledResource = function () {
  function PooledResource(resource) {
    _classCallCheck(this, PooledResource);

    this.creationTime = Date.now();
    this.lastReturnTime = null;
    this.lastBorrowTime = null;
    this.lastIdleTime = null;
    this.obj = resource;
    this.state = PooledResourceStateEnum.IDLE;
  }

  // mark the resource as "allocated"


  _createClass(PooledResource, [{
    key: 'allocate',
    value: function allocate() {
      this.lastBorrowTime = Date.now();
      this.state = PooledResourceStateEnum.ALLOCATED;
    }

    // mark the resource as "deallocated"

  }, {
    key: 'deallocate',
    value: function deallocate() {
      this.lastReturnTime = Date.now();
      this.state = PooledResourceStateEnum.IDLE;
    }
  }, {
    key: 'invalidate',
    value: function invalidate() {
      this.state = PooledResourceStateEnum.INVALID;
    }
  }, {
    key: 'test',
    value: function test() {
      this.state = PooledResourceStateEnum.VALIDATION;
    }
  }, {
    key: 'idle',
    value: function idle() {
      this.lastIdleTime = Date.now();
      this.state = PooledResourceStateEnum.IDLE;
    }
  }, {
    key: 'returning',
    value: function returning() {
      this.state = PooledResourceStateEnum.RETURNING;
    }
  }]);

  return PooledResource;
}();

module.exports = PooledResource;