'use strict';

/**
 * This is apparently a bit like a Jquery deferred, hence the name
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Deferred = function () {
  function Deferred(Promise) {
    var _this = this;

    _classCallCheck(this, Deferred);

    this._state = Deferred.PENDING;
    this._resolve = undefined;
    this._reject = undefined;

    this._promise = new Promise(function (resolve, reject) {
      _this._resolve = resolve;
      _this._reject = reject;
    });
  }

  _createClass(Deferred, [{
    key: 'reject',
    value: function reject(reason) {
      if (this._state !== Deferred.PENDING) {
        return;
      }
      this._state = Deferred.REJECTED;
      this._reject(reason);
    }
  }, {
    key: 'resolve',
    value: function resolve(value) {
      if (this._state !== Deferred.PENDING) {
        return;
      }
      this._state = Deferred.FULFILLED;
      this._resolve(value);
    }
  }, {
    key: 'state',
    get: function get() {
      return this._state;
    }
  }, {
    key: 'promise',
    get: function get() {
      return this._promise;
    }
  }]);

  return Deferred;
}();

// TODO: should these really live here? or be a seperate 'state' enum


Deferred.PENDING = 'PENDING';
Deferred.FULFILLED = 'FULFILLED';
Deferred.REJECTED = 'REJECTED';

module.exports = Deferred;