'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Queue = require('./Queue');

/**
 * @class
 * @private
 */

var PriorityQueue = function () {
  function PriorityQueue(size) {
    _classCallCheck(this, PriorityQueue);

    this._size = Math.max(+size | 0, 1);
    this._slots = [];
    // initialize arrays to hold queue elements
    for (var i = 0; i < this._size; i++) {
      this._slots.push(new Queue());
    }
  }

  _createClass(PriorityQueue, [{
    key: 'enqueue',
    value: function enqueue(obj, priority) {
      // Convert to integer with a default value of 0.
      priority = priority && +priority | 0 || 0;

      if (priority) {
        if (priority < 0 || priority >= this._size) {
          priority = this._size - 1;
          // put obj at the end of the line
        }
      }
      this._slots[priority].push(obj);
    }
  }, {
    key: 'dequeue',
    value: function dequeue() {
      for (var i = 0, sl = this._slots.length; i < sl; i += 1) {
        if (this._slots[i].length) {
          return this._slots[i].shift();
        }
      }
      return;
    }
  }, {
    key: 'length',
    get: function get() {
      var _length = 0;
      for (var i = 0, slots = this._slots.length; i < slots; i++) {
        _length += this._slots[i].length;
      }
      return _length;
    }
  }, {
    key: 'head',
    get: function get() {
      for (var i = 0, sl = this._slots.length; i < sl; i += 1) {
        if (this._slots[i].length > 0) {
          return this._slots[i].head;
        }
      }
      return;
    }
  }, {
    key: 'tail',
    get: function get() {
      for (var i = this._slots.length - 1; i >= 0; i--) {
        if (this._slots[i].length > 0) {
          return this._slots[i].tail;
        }
      }
      return;
    }
  }]);

  return PriorityQueue;
}();

module.exports = PriorityQueue;