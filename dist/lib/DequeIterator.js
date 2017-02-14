'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DoublyLinkedListIterator = require('./DoublyLinkedListIterator');
/**
 * Thin wrapper around an underlying DDL iterator
 */

var DequeIterator = function (_DoublyLinkedListIter) {
  _inherits(DequeIterator, _DoublyLinkedListIter);

  function DequeIterator() {
    _classCallCheck(this, DequeIterator);

    return _possibleConstructorReturn(this, (DequeIterator.__proto__ || Object.getPrototypeOf(DequeIterator)).apply(this, arguments));
  }

  _createClass(DequeIterator, [{
    key: 'next',
    value: function next() {
      var result = _get(DequeIterator.prototype.__proto__ || Object.getPrototypeOf(DequeIterator.prototype), 'next', this).call(this);

      // unwrap the node...
      if (result.value) {
        result.value = result.value.data;
      }

      return result;
    }
  }]);

  return DequeIterator;
}(DoublyLinkedListIterator);

module.exports = DequeIterator;