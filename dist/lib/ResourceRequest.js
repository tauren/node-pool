'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Deferred = require('./Deferred');
var errors = require('./errors');

function fbind(fn, ctx) {
  return function bound() {
    return fn.apply(ctx, arguments);
  };
}

/**
 * Wraps a users request for a resource
 * Basically a promise mashed in with a timeout
 * @private
 */

var ResourceRequest = function (_Deferred) {
  _inherits(ResourceRequest, _Deferred);

  /**
   * [constructor description]
   * @param  {Number} ttl     timeout
   */
  function ResourceRequest(ttl, Promise) {
    _classCallCheck(this, ResourceRequest);

    var _this = _possibleConstructorReturn(this, (ResourceRequest.__proto__ || Object.getPrototypeOf(ResourceRequest)).call(this, Promise));

    _this._creationTimestamp = Date.now();
    _this._timeout = null;

    if (ttl !== undefined) {
      _this.setTimeout(ttl);
    }
    return _this;
  }

  _createClass(ResourceRequest, [{
    key: 'setTimeout',
    value: function (_setTimeout) {
      function setTimeout(_x) {
        return _setTimeout.apply(this, arguments);
      }

      setTimeout.toString = function () {
        return _setTimeout.toString();
      };

      return setTimeout;
    }(function (delay) {
      if (this._state !== ResourceRequest.PENDING) {
        return;
      }
      var ttl = parseInt(delay, 10);

      if (isNaN(ttl) || ttl <= 0) {
        throw new Error('delay must be a positive int');
      }

      var age = Date.now() - this._creationTimestamp;

      if (this._timeout) {
        this.removeTimeout();
      }

      this._timeout = setTimeout(fbind(this._fireTimeout, this), Math.max(ttl - age, 0));
    })
  }, {
    key: 'removeTimeout',
    value: function removeTimeout() {
      clearTimeout(this._timeout);
      this._timeout = null;
    }
  }, {
    key: '_fireTimeout',
    value: function _fireTimeout() {
      this.reject(new errors.TimeoutError('ResourceRequest timed out'));
    }
  }, {
    key: 'reject',
    value: function reject(reason) {
      this.removeTimeout();
      _get(ResourceRequest.prototype.__proto__ || Object.getPrototypeOf(ResourceRequest.prototype), 'reject', this).call(this, reason);
    }
  }, {
    key: 'resolve',
    value: function resolve(value) {
      this.removeTimeout();
      _get(ResourceRequest.prototype.__proto__ || Object.getPrototypeOf(ResourceRequest.prototype), 'resolve', this).call(this, value);
    }
  }]);

  return ResourceRequest;
}(Deferred);

module.exports = ResourceRequest;