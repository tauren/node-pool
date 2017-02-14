'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events').EventEmitter;

var factoryValidator = require('./factoryValidator');
var PoolOptions = require('./PoolOptions');
var ResourceRequest = require('./ResourceRequest');
var ResourceLoan = require('./ResourceLoan');
var PooledResource = require('./PooledResource');

var reflector = require('./utils').reflector;

/**
 * TODO: move me
 */
var FACTORY_CREATE_ERROR = 'factoryCreateError';
var FACTORY_DESTROY_ERROR = 'factoryDestroyError';

var Pool = function (_EventEmitter) {
  _inherits(Pool, _EventEmitter);

  /**
   * Generate an Object pool with a specified `factory` and `config`.
   *
   * @param {Object} factory
   *   Factory to be used for generating and destroying the items.
   * @param {Function} factory.create
   *   Should create the item to be acquired,
   *   and call it's first callback argument with the generated item as it's argument.
   * @param {Function} factory.destroy
   *   Should gently close any resources that the item is using.
   *   Called before the items is destroyed.
   * @param {Function} factory.validate
   *   Test if a resource is still valid .Should return a promise that resolves to a boolean, true if resource is still valid and false
   *   If it should be removed from pool.
   */
  function Pool(Evictor, Deque, PriorityQueue, factory, options) {
    _classCallCheck(this, Pool);

    var _this = _possibleConstructorReturn(this, (Pool.__proto__ || Object.getPrototypeOf(Pool)).call(this));

    factoryValidator(factory);

    _this._config = new PoolOptions(options);

    // TODO: fix up this ugly glue-ing
    _this._Promise = _this._config.Promise;

    _this._factory = factory;
    _this._draining = false;
    _this._started = false;
    /**
     * Holds waiting clients
     * @type {PriorityQueue}
     */
    _this._waitingClientsQueue = new PriorityQueue(_this._config.priorityRange);

    /**
     * Collection of promises for resource creation calls made by the pool to factory.create
     * @type {Set}
     */
    _this._factoryCreateOperations = new Set();

    /**
     * Collection of promises for resource destruction calls made by the pool to factory.destroy
     * @type {Set}
     */
    _this._factoryDestroyOperations = new Set();

    /**
     * A queue/stack of pooledResources awaiting acquisition
     * TODO: replace with LinkedList backed array
     * @type {Array}
     */
    _this._availableObjects = new Deque();

    /**
     * Collection of references for any resource that are undergoing validation before being acquired
     * @type {Set}
     */
    _this._testOnBorrowResources = new Set();

    /**
     * Collection of references for any resource that are undergoing validation before being returned
     * @type {Set}
     */
    _this._testOnReturnResources = new Set();

    /**
     * Collection of promises for any validations currently in process
     * @type {Set}
     */
    _this._validationOperations = new Set();

    /**
     * All objects associated with this pool in any state (except destroyed)
     * @type {PooledResourceCollection}
     */
    _this._allObjects = new Set();

    /**
     * Loans keyed by the borrowed resource
     * @type {Map}
     */
    _this._resourceLoans = new Map();

    /**
     * Infinitely looping iterator over available object
     * @type {DLLArrayIterator}
     */
    _this._evictionIterator = _this._availableObjects.iterator();

    _this._evictor = new Evictor();

    /**
     * handle for setTimeout for next eviction run
     * @type {[type]}
     */
    _this._scheduledEviction = null;

    // create initial resources (if factory.min > 0)
    if (_this._config.autostart === true) {
      _this.start();
    }
    return _this;
  }

  _createClass(Pool, [{
    key: '_destroy',
    value: function _destroy(pooledResource) {
      var _this2 = this;

      // FIXME: do we need another state for "in destruction"?
      pooledResource.invalidate();
      this._allObjects.delete(pooledResource);
      // NOTE: this maybe very bad promise usage?
      var destroyPromise = this._factory.destroy(pooledResource.obj);
      var wrappedDestroyPromise = this._Promise.resolve(destroyPromise);

      this._trackOperation(wrappedDestroyPromise, this._factoryDestroyOperations).catch(function (reason) {
        _this2.emit(FACTORY_DESTROY_ERROR, reason);
      });

      // TODO: maybe ensuring minimum pool size should live outside here
      this._ensureMinimum();
    }

    /**
     * Attempt to move an available resource into test and then onto a waiting client
     * @return {Boolean} could we move an available resource into test
     */

  }, {
    key: '_testOnBorrow',
    value: function _testOnBorrow() {
      var _this3 = this;

      if (this._availableObjects.length < 1) {
        return false;
      }

      var pooledResource = this._availableObjects.shift();
      // Mark the resource as in test
      pooledResource.test();
      this._testOnBorrowResources.add(pooledResource);
      var validationPromise = this._factory.validate(pooledResource.obj);
      var wrappedValidationPromise = this._Promise.resolve(validationPromise);

      this._trackOperation(wrappedValidationPromise, this._validationOperations).then(function (isValid) {
        _this3._testOnBorrowResources.delete(pooledResource);

        if (isValid === false) {
          pooledResource.invalidate();
          _this3._destroy(pooledResource);
          _this3._dispense();
          return;
        }
        _this3._dispatchPooledResourceToNextWaitingClient(pooledResource);
      });

      return true;
    }

    /**
     * Attempt to move an available resource to a waiting client
     * @return {Boolean} [description]
     */

  }, {
    key: '_dispatchResource',
    value: function _dispatchResource() {
      if (this._availableObjects.length < 1) {
        return false;
      }

      var pooledResource = this._availableObjects.shift();
      this._dispatchPooledResourceToNextWaitingClient(pooledResource);
      return;
    }

    /**
     * Attempt to resolve an outstanding resource request using an available resource from
     * the pool, or creating new ones
     *
     * @private
     */

  }, {
    key: '_dispense',
    value: function _dispense() {
      /**
       * Local variables for ease of reading/writing
       * these don't (shouldn't) change across the execution of this fn
       */
      var numWaitingClients = this._waitingClientsQueue.length;

      // If there aren't any waiting requests then there is nothing to do
      // so lets short-circuit
      if (numWaitingClients < 1) {
        return;
      }

      var resourceShortfall = numWaitingClients - this._potentiallyAllocableResourceCount;

      var actualNumberOfResourcesToCreate = Math.min(this.spareResourceCapacity, resourceShortfall);
      for (var i = 0; actualNumberOfResourcesToCreate > i; i++) {
        this._createResource();
      }

      // If we are doing test-on-borrow see how many more resources need to be moved into test
      // to help satisfy waitingClients
      if (this._config.testOnBorrow === true) {
        // how many available resources do we need to shift into test
        var desiredNumberOfResourcesToMoveIntoTest = numWaitingClients - this._testOnBorrowResources.size;
        var actualNumberOfResourcesToMoveIntoTest = Math.min(this._availableObjects.length, desiredNumberOfResourcesToMoveIntoTest);
        for (var _i = 0; actualNumberOfResourcesToMoveIntoTest > _i; _i++) {
          this._testOnBorrow();
        }
      }

      // if we aren't testing-on-borrow then lets try to allocate what we can
      if (this._config.testOnBorrow === false) {
        var actualNumberOfResourcesToDispatch = Math.min(this._availableObjects.length, numWaitingClients);
        for (var _i2 = 0; actualNumberOfResourcesToDispatch > _i2; _i2++) {
          this._dispatchResource();
        }
      }
    }

    /**
     * Dispatches a pooledResource to the next waiting client (if any) else
     * puts the PooledResource back on the available list
     * @param  {[type]} pooledResource [description]
     * @return {[type]}                [description]
     */

  }, {
    key: '_dispatchPooledResourceToNextWaitingClient',
    value: function _dispatchPooledResourceToNextWaitingClient(pooledResource) {
      var clientResourceRequest = this._waitingClientsQueue.dequeue();
      if (clientResourceRequest === undefined) {
        // While we were away either all the waiting clients timed out
        // or were somehow fulfilled. put our pooledResource back.
        this._addPooledResourceToAvailableObjects(pooledResource);
        // TODO: do need to trigger anything before we leave?
        return false;
      }
      var loan = new ResourceLoan(pooledResource, this._Promise);
      this._resourceLoans.set(pooledResource.obj, loan);
      pooledResource.allocate();
      clientResourceRequest.resolve(pooledResource.obj);
      return true;
    }

    /**
     * tracks on operation using given set
     * handles adding/removing from the set and resolve/rejects the value/reason
     * @param  {Promise} operation
     * @param  {Set} set       Set holding operations
     * @return {Promise}       Promise that resolves once operation has been removed from set
     */

  }, {
    key: '_trackOperation',
    value: function _trackOperation(operation, set) {
      var _this4 = this;

      set.add(operation);

      return operation.then(function (v) {
        set.delete(operation);
        return _this4._Promise.resolve(v);
      }, function (e) {
        set.delete(operation);
        return _this4._Promise.reject(e);
      });
    }

    /**
     * @private
     */

  }, {
    key: '_createResource',
    value: function _createResource() {
      var _this5 = this;

      // An attempt to create a resource
      var factoryPromise = this._factory.create();
      var wrappedFactoryPromise = this._Promise.resolve(factoryPromise);

      this._trackOperation(wrappedFactoryPromise, this._factoryCreateOperations).then(function (resource) {
        _this5._handleNewResource(resource);
        return null;
      }).catch(function (reason) {
        _this5.emit(FACTORY_CREATE_ERROR, reason);
        _this5._dispense();
      });
    }
  }, {
    key: '_handleNewResource',
    value: function _handleNewResource(resource) {
      var pooledResource = new PooledResource(resource);
      this._allObjects.add(pooledResource);
      // TODO: check we aren't exceding our maxPoolSize before doing
      this._dispatchPooledResourceToNextWaitingClient(pooledResource);
    }

    /**
     * @private
     */

  }, {
    key: '_ensureMinimum',
    value: function _ensureMinimum() {
      if (this._draining === true) {
        return;
      }
      var minShortfall = this._config.min - this._count;
      for (var i = 0; i < minShortfall; i++) {
        this._createResource();
      }
    }
  }, {
    key: '_evict',
    value: function _evict() {
      var testsToRun = Math.min(this._config.numTestsPerEvictionRun, this._availableObjects.length);
      var evictionConfig = {
        softIdleTimeoutMillis: this._config.softIdleTimeoutMillis,
        idleTimeoutMillis: this._config.idleTimeoutMillis,
        min: this._config.min
      };
      for (var testsHaveRun = 0; testsHaveRun < testsToRun;) {
        var iterationResult = this._evictionIterator.next();

        // Safety check incase we could get stuck in infinite loop because we
        // somehow emptied the array after chekcing it's length
        if (iterationResult.done === true && this._availableObjects.length < 1) {
          this._evictionIterator.reset();
          return;
        }
        // if this happens it should just mean we reached the end of the
        // list and can reset the cursor.
        if (iterationResult.done === true && this._availableObjects.length > 0) {
          this._evictionIterator.reset();
          break;
        }

        var resource = iterationResult.value;

        var shouldEvict = this._evictor.evict(evictionConfig, resource, this._availableObjects.length);
        testsHaveRun++;

        if (shouldEvict === true) {
          // take it out of the _availableObjects list
          this._evictionIterator.remove();
          this._destroy(resource);
        }
      }
    }
  }, {
    key: '_scheduleEvictorRun',
    value: function _scheduleEvictorRun() {
      var _this6 = this;

      // Start eviction if set
      if (this._config.evictionRunIntervalMillis > 0) {
        this._scheduledEviction = setTimeout(function () {
          _this6._evict();
          _this6._scheduleEvictorRun();
        }, this._config.evictionRunIntervalMillis);
      }
    }
  }, {
    key: '_descheduleEvictorRun',
    value: function _descheduleEvictorRun() {
      clearTimeout(this._scheduledEviction);
      this._scheduledEviction = null;
    }
  }, {
    key: 'start',
    value: function start() {
      if (this._draining === true) {
        return;
      }
      if (this._started === true) {
        return;
      }
      this._started = true;
      this._scheduleEvictorRun();
      this._ensureMinimum();
    }

    /**
     * Request a new resource. The callback will be called,
     * when a new resource is available, passing the resource to the callback.
     * TODO: should we add a seperate "acquireWithPriority" function
     *
     * @param {Function} callback
     *   Callback function to be called after the acquire is successful.
     *   If there is an error preventing the acquisition of resource, an error will
     *   be the first parameter, else it will be null.
     *   The acquired resource will be the second parameter.
     *
     * @param {Number} priority
     *   Optional.  Integer between 0 and (priorityRange - 1).  Specifies the priority
     *   of the caller if there are no available resources.  Lower numbers mean higher
     *   priority.
     *
     * @returns {Promise}
     */

  }, {
    key: 'acquire',
    value: function acquire(priority) {
      if (this._draining) {
        return this._Promise.reject(new Error('pool is draining and cannot accept work'));
      }

      // TODO: should we defer this check till after this event loop incase "the situation" changes in the meantime
      if (this._config.maxWaitingClients !== undefined && this._waitingClientsQueue.length >= this._config.maxWaitingClients) {
        return this._Promise.reject(new Error('max waitingClients count exceeded'));
      }

      var resourceRequest = new ResourceRequest(this._config.acquireTimeoutMillis, this._Promise);
      this._waitingClientsQueue.enqueue(resourceRequest, priority);
      this._dispense();

      return resourceRequest.promise;
    }

    /**
     * Return the resource to the pool when it is no longer required.
     *
     * @param {Object} obj
     *   The acquired object to be put back to the pool.
     */

  }, {
    key: 'release',
    value: function release(resource) {
      // check for an outstanding loan
      var loan = this._resourceLoans.get(resource);

      if (loan === undefined) {
        return this._Promise.reject(new Error('Resource not currently part of this pool'));
      }

      this._resourceLoans.delete(resource);
      loan.resolve();
      var pooledResource = loan.pooledResource;

      pooledResource.deallocate();
      this._addPooledResourceToAvailableObjects(pooledResource);

      this._dispense();
      return this._Promise.resolve();
    }

    /**
     * Request the resource to be destroyed. The factory's destroy handler
     * will also be called.
     *
     * This should be called within an acquire() block as an alternative to release().
     *
     * @param {Object} resource
     *   The acquired resource to be destoyed.
     */

  }, {
    key: 'destroy',
    value: function destroy(resource) {
      // check for an outstanding loan
      var loan = this._resourceLoans.get(resource);

      if (loan === undefined) {
        return this._Promise.reject(new Error('Resource not currently part of this pool'));
      }

      this._resourceLoans.delete(resource);
      loan.resolve();
      var pooledResource = loan.pooledResource;

      pooledResource.deallocate();
      this._destroy(pooledResource);

      this._dispense();
      return this._Promise.resolve();
    }
  }, {
    key: '_addPooledResourceToAvailableObjects',
    value: function _addPooledResourceToAvailableObjects(pooledResource) {
      pooledResource.idle();
      if (this._config.fifo === true) {
        this._availableObjects.push(pooledResource);
      } else {
        this._availableObjects.unshift(pooledResource);
      }
    }

    /**
     * Disallow any new acquire calls and let the request backlog dissapate.
     * The Pool will no longer attempt to maintain a "min" number of resources
     * and will only make new resources on demand.
     * Resolves once all resource requests are fulfilled and all resources are returned to pool and available...
     * Should probably be called "drain work"
     * @returns {Promise}
     */

  }, {
    key: 'drain',
    value: function drain() {
      var _this7 = this;

      this._draining = true;
      return this.__allResourceRequestsSettled().then(function () {
        return _this7.__allResourcesReturned();
      }).then(function () {
        _this7._descheduleEvictorRun();
      });
    }
  }, {
    key: '__allResourceRequestsSettled',
    value: function __allResourceRequestsSettled() {
      if (this._waitingClientsQueue.length > 0) {
        // wait for last waiting client to be settled
        // FIXME: what if they can "resolve" out of order....?
        return reflector(this._waitingClientsQueue.tail.promise);
      }
      return this._Promise.resolve();
    }

    // FIXME: this is a horrific mess

  }, {
    key: '__allResourcesReturned',
    value: function __allResourcesReturned() {
      var ps = Array.from(this._resourceLoans.values()).map(function (loan) {
        return loan.promise;
      }).map(reflector);
      return this._Promise.all(ps);
    }

    /**
     * Forcibly destroys all available resources regardless of timeout.  Intended to be
     * invoked as part of a drain.  Does not prevent the creation of new
     * resources as a result of subsequent calls to acquire.
     *
     * Note that if factory.min > 0 and the pool isn't "draining", the pool will destroy all idle resources
     * in the pool, but replace them with newly created resources up to the
     * specified factory.min value.  If this is not desired, set factory.min
     * to zero before calling clear()
     *
     */

  }, {
    key: 'clear',
    value: function clear() {
      var _this8 = this;

      var reflectedCreatePromises = Array.from(this._factoryCreateOperations).map(reflector);

      // wait for outstanding factory.create to complete
      return this._Promise.all(reflectedCreatePromises).then(function () {
        // Destroy existing resources
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = _this8._availableObjects[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var resource = _step.value;

            _this8._destroy(resource);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        var reflectedDestroyPromises = Array.from(_this8._factoryDestroyOperations).map(reflector);
        return _this8._Promise.all(reflectedDestroyPromises);
      });
    }

    /**
     * How many resources are available to allocated
     * (includes resources that have not been tested and may faul validation)
     * NOTE: internal for now as the name is awful and might not be useful to anyone
     * @return {Number} number of resources the pool has to allocate
     */

  }, {
    key: '_potentiallyAllocableResourceCount',
    get: function get() {
      return this._availableObjects.length + this._testOnBorrowResources.size + this._testOnReturnResources.size + this._factoryCreateOperations.size;
    }

    /**
     * The combined count of the currently created objects and those in the
     * process of being created
     * Does NOT include resources in the process of being destroyed
     * sort of legacy...
     * @return {Number}
     */

  }, {
    key: '_count',
    get: function get() {
      return this._allObjects.size + this._factoryCreateOperations.size;
    }

    /**
     * How many more resources does the pool have room for
     * @return {Number} number of resources the pool could create before hitting any limits
     */

  }, {
    key: 'spareResourceCapacity',
    get: function get() {
      return this._config.max - (this._allObjects.size + this._factoryCreateOperations.size);
    }

    /**
     * see _count above
     * @return {Number} [description]
     */

  }, {
    key: 'size',
    get: function get() {
      return this._count;
    }

    /**
     * number of available resources
     * @return {Number} [description]
     */

  }, {
    key: 'available',
    get: function get() {
      return this._availableObjects.length;
    }

    /**
     * number of resources that are currently acquired
     * @return {[type]} [description]
     */

  }, {
    key: 'borrowed',
    get: function get() {
      return this._resourceLoans.size;
    }

    /**
     * number of waiting acquire calls
     * @return {[type]} [description]
     */

  }, {
    key: 'pending',
    get: function get() {
      return this._waitingClientsQueue.length;
    }

    /**
     * maximum size of the pool
     * @return {[type]} [description]
     */

  }, {
    key: 'max',
    get: function get() {
      return this._config.max;
    }

    /**
     * minimum size of the pool
     * @return {[type]} [description]
     */

  }, {
    key: 'min',
    get: function get() {
      return this._config.min;
    }
  }]);

  return Pool;
}(EventEmitter);

module.exports = Pool;