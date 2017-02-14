'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DefaultEvictor = function () {
  function DefaultEvictor() {
    _classCallCheck(this, DefaultEvictor);
  }

  _createClass(DefaultEvictor, [{
    key: 'evict',
    value: function evict(config, pooledResource, availableObjectsCount) {
      var idleTime = Date.now() - pooledResource.lastIdleTime;

      if (config.softIdleTimeoutMillis < idleTime && config.min < availableObjectsCount) {
        return true;
      }

      if (config.idleTimeoutMillis < idleTime) {
        return true;
      }

      return false;
    }
  }]);

  return DefaultEvictor;
}();

module.exports = DefaultEvictor;