'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DoublyLinkedList = require('./DoublyLinkedList');
var Deque = require('./Deque');

/**
 * Sort of a internal queue for holding the waiting
 * resource requets for a given "priority".
 * Also handles managing timeouts rejections on items (is this the best place for this?)
 * This is the last point where we know which queue a resourceRequest is in
 *
 */

var Queue = function (_Deque) {
  _inherits(Queue, _Deque);

  function Queue() {
    _classCallCheck(this, Queue);

    return _possibleConstructorReturn(this, (Queue.__proto__ || Object.getPrototypeOf(Queue)).apply(this, arguments));
  }

  _createClass(Queue, [{
    key: 'push',

    /**
     * Adds the obj to the end of the list for this slot
     * we completely override the parent method because we need access to the
     * node for our rejection handler
     * @param {[type]} item [description]
     */
    value: function push(resourceRequest) {
      var node = DoublyLinkedList.createNode(resourceRequest);
      resourceRequest.promise.catch(this._createTimeoutRejectionHandler(node));
      this._list.insertEnd(node);
    }
  }, {
    key: '_createTimeoutRejectionHandler',
    value: function _createTimeoutRejectionHandler(node) {
      var _this2 = this;

      return function (reason) {
        if (reason.name === 'TimeoutError') {
          _this2._list.remove(node);
        }
      };
    }
  }]);

  return Queue;
}(Deque);

module.exports = Queue;