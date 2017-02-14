'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DoublyLinkedList = require('./DoublyLinkedList');
var DequeIterator = require('./DequeIterator');
/**
 * DoublyLinkedList backed double ended queue
 * implements just enough to keep the Pool
 */

var Deque = function () {
  function Deque() {
    _classCallCheck(this, Deque);

    this._list = new DoublyLinkedList();
  }

  /**
   * removes and returns the first element from the queue
   * @return {[type]} [description]
   */


  _createClass(Deque, [{
    key: 'shift',
    value: function shift() {
      if (this._length === 0) {
        return undefined;
      }

      var node = this._list.head;
      this._list.remove(node);

      return node.data;
    }

    /**
     * adds one elemts to the beginning of the queue
     * @param  {[type]} element [description]
     * @return {[type]}         [description]
     */

  }, {
    key: 'unshift',
    value: function unshift(element) {
      var node = DoublyLinkedList.createNode(element);

      this._list.insertBeginning(node);
    }

    /**
     * adds one to the end of the queue
     * @param  {[type]} element [description]
     * @return {[type]}         [description]
     */

  }, {
    key: 'push',
    value: function push(element) {
      var node = DoublyLinkedList.createNode(element);

      this._list.insertEnd(node);
    }

    /**
     * removes and returns the last element from the queue
     */

  }, {
    key: 'pop',
    value: function pop() {
      if (this._length === 0) {
        return undefined;
      }

      var node = this._list.tail;
      this._list.remove(node);

      return node.data;
    }
  }, {
    key: Symbol.iterator,
    value: function value() {
      return new DequeIterator(this._list);
    }
  }, {
    key: 'iterator',
    value: function iterator() {
      return new DequeIterator(this._list);
    }
  }, {
    key: 'reverseIterator',
    value: function reverseIterator() {
      return new DequeIterator(this._list, true);
    }

    /**
     * get a reference to the item at the head of the queue
     * @return {element} [description]
     */

  }, {
    key: 'head',
    get: function get() {
      if (this._list.length === 0) {
        return undefined;
      }
      var node = this._list.head;
      return node.data;
    }

    /**
     * get a reference to the item at the tail of the queue
     * @return {element} [description]
     */

  }, {
    key: 'tail',
    get: function get() {
      if (this._list.length === 0) {
        return undefined;
      }
      var node = this._list.tail;
      return node.data;
    }
  }, {
    key: 'length',
    get: function get() {
      return this._list.length;
    }
  }]);

  return Deque;
}();

module.exports = Deque;