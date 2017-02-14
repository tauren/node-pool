'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Deferred = require('./Deferred');

/**
 * Plan is to maybe add tracking via Error objects
 * and other fun stuff!
 */

var ResourceLoan = function (_Deferred) {
  _inherits(ResourceLoan, _Deferred);

  /**
   *
   * @param  {PooledResource} pooledResource the PooledResource this loan belongs to
   * @return {[type]}                [description]
   */
  function ResourceLoan(pooledResource, Promise) {
    _classCallCheck(this, ResourceLoan);

    var _this = _possibleConstructorReturn(this, (ResourceLoan.__proto__ || Object.getPrototypeOf(ResourceLoan)).call(this, Promise));

    _this._creationTimestamp = Date.now();
    _this.pooledResource = pooledResource;
    return _this;
  }

  _createClass(ResourceLoan, [{
    key: 'reject',
    value: function reject() {
      /**
       * Loans can only be resolved at the moment
       */
    }
  }]);

  return ResourceLoan;
}(Deferred);

module.exports = ResourceLoan;