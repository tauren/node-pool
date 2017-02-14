'use strict';

var Pool = require('./lib/Pool');
var Deque = require('./lib/Deque');
var PriorityQueue = require('./lib/PriorityQueue');
var DefaultEvictor = require('./lib/DefaultEvictor');
module.exports = {
  Pool: Pool,
  Deque: Deque,
  PriorityQueue: PriorityQueue,
  DefaultEvictor: DefaultEvictor,
  createPool: function createPool(factory, config) {
    return new Pool(DefaultEvictor, Deque, PriorityQueue, factory, config);
  }
};