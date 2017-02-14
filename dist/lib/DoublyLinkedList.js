'use strict';

/**
 * A Doubly Linked List, because there aren't enough in the world...
 * this is pretty much a direct JS port of the one wikipedia
 * https://en.wikipedia.org/wiki/Doubly_linked_list
 *
 * For most usage 'insertBeginning' and 'insertEnd' should be enough
 *
 * nodes are expected to something like a POJSO like
 * {
 *   prev: null,
 *   next: null,
 *   something: 'whatever you like'
 * }
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DoublyLinkedList = function () {
  function DoublyLinkedList() {
    _classCallCheck(this, DoublyLinkedList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  _createClass(DoublyLinkedList, [{
    key: 'insertBeginning',
    value: function insertBeginning(node) {
      if (this.head === null) {
        this.head = node;
        this.tail = node;
        node.prev = null;
        node.next = null;
        this.length++;
      } else {
        this.insertBefore(this.head, node);
      }
    }
  }, {
    key: 'insertEnd',
    value: function insertEnd(node) {
      if (this.tail === null) {
        this.insertBeginning(node);
      } else {
        this.insertAfter(this.tail, node);
      }
    }
  }, {
    key: 'insertAfter',
    value: function insertAfter(node, newNode) {
      newNode.prev = node;
      newNode.next = node.next;
      if (node.next === null) {
        this.tail = newNode;
      } else {
        node.next.prev = newNode;
      }
      node.next = newNode;
      this.length++;
    }
  }, {
    key: 'insertBefore',
    value: function insertBefore(node, newNode) {
      newNode.prev = node.prev;
      newNode.next = node;
      if (node.prev === null) {
        this.head = newNode;
      } else {
        node.prev.next = newNode;
      }
      node.prev = newNode;
      this.length++;
    }
  }, {
    key: 'remove',
    value: function remove(node) {
      if (node.prev === null) {
        this.head = node.next;
      } else {
        node.prev.next = node.next;
      }
      if (node.next === null) {
        this.tail = node.prev;
      } else {
        node.next.prev = node.prev;
      }
      node.prev = null;
      node.next = null;
      this.length--;
    }

    // FIXME: this should not live here and has become a dumping ground...

  }], [{
    key: 'createNode',
    value: function createNode(data) {
      return {
        prev: null,
        next: null,
        data: data
      };
    }
  }]);

  return DoublyLinkedList;
}();

module.exports = DoublyLinkedList;