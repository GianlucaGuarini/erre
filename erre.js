(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.erre = factory());
}(this, (function () { 'use strict';

/**
 * Cancel token
 * @private
 * @type { Symbol }
 */
const CANCEL = Symbol();

/**
 * Helper that can be returned by ruit function to cancel the tasks chain
 * @returns { Symbol } internal private constant
 * @example
 *
 * ruit(
 *   100,
 *   num => Math.random() * num
 *   num => num > 50 ? ruit.cancel() : num
 *   num => num - 2
 * ).then(result => {
 *   console.log(result) // here we will get only number lower than 50
 * })
 *
 */
ruit.cancel = () => CANCEL;

/**
 * The same as ruit() but with the arguments inverted from right to left
 * @param   { * } tasks - list of tasks to process sequentially
 * @returns { Promise } a promise containing the result of the whole chain
 * @example
 *
 * const curry = f => a => b => f(a, b)
 * const add = (a, b) => a + b
 *
 * const addOne = curry(add)(1)
 *
 * const squareAsync = (num) => {
 *   return new Promise(r => {
 *     setTimeout(r, 500, num * 2)
 *   })
 * }
 *
 * // a -> a + a -> a * 2
 * // basically from right to left: 1 => 1 + 1 => 2 * 2
 * ruit.compose(squareAsync, addOne, 1).then(result => console.log(result)) // 4
 */
ruit.compose = (...tasks) => ruit(...tasks.reverse());

/**
 * Serialize a list of sync and async tasks from left to right
 * @param   { * } tasks - list of tasks to process sequentially
 * @returns { Promise } a promise containing the result of the whole chain
 * @example
 *
 * const curry = f => a => b => f(a, b)
 * const add = (a, b) => a + b
 *
 * const addOne = curry(add)(1)
 *
 * const squareAsync = (num) => {
 *   return new Promise(r => {
 *     setTimeout(r, 500, num * 2)
 *   })
 * }
 *
 * // a -> a + a -> a * 2
 * // basically from left to right: 1 => 1 + 1 => 2 * 2
 * ruit(1, addOne, squareAsync).then(result => console.log(result)) // 4
 */
function ruit (...tasks) {
  return new Promise((resolve, reject) => {
    return (function run(result) {
      if (!tasks.length) return resolve(result)

      const task = tasks.shift();
      const value = typeof task === 'function' ? task(result) : task;

      // check against nil values
      if (value != null) {
        if (value === CANCEL) return
        if (value.then) return value.then(run, reject)
      }

      return Promise.resolve(run(value))
    })()
  })
}

// Symbol used to end the stream
const THE_END = Symbol();

/**
 * Factory function to create the stream generator
 * @private
 * @generator
 * @yields {Set|Promise} - the stream modifiers, and the async results
 * @returns {undefined} just end the stream
 */
function createStream() {
  const stream = (function *stream() {
    while (true) {
      // get the modifiers
      const modifiers = yield;
      // get the initial stream value
      const input = yield;
      // end the stream
      if (input === THE_END) return
      // execute the chain
      yield ruit(input, ...Array.from(modifiers));
    }
  })();

  // start the generator
  stream.next();

  return stream
}

/**
 * Dispatch a value to several listeners
 * @private
 * @param   {Set} callbacks - callbacks collection
 * @param   {*} value - anything
 * @returns {Set} the callbacks received
 */
function dispatch(callbacks, value) {
  callbacks.forEach(f => f(value));
  return callbacks
}

/**
 * Execute a single stream event
 * @param   {Function} stream - stream generator
 * @param   {Set} modifiers - event modifiers collection
 * @param   {*} input - initial stream input
 * @returns {Object} result
 * @returns {Boolean} result.done - generator done flag
 * @returns {Promise} result.value - async result
 */
function exec(stream, modifiers, input) {
  // pass the modifiers to the stream
  stream.next(modifiers);
  // execute the stream
  const { value, done } = stream.next(input);
  return { value, done }
}

/**
 * Stream constuction function
 * @param   {...Function} fns - stream modifiers
 * @returns {Object} erre instance
 */
function erre(...fns) {
  const success = new Set();
  const errors = new Set();
  const modifiers = new Set(fns);
  const stream = createStream();

  return {
    onValue(callback) {
      success.add(callback);
      return this
    },
    onError(callback) {
      errors.add(callback);
      return this
    },
    enhance(fn) {
      modifiers.add(fn);
      return this
    },
    end() {
      // kill the stream
      exec(stream, modifiers, THE_END);

      // clean up all the collections
      success.clear();
      errors.clear();
      modifiers.clear();

      return this
    },
    push(input) {
      // execute the stream
      const { value, done } = exec(stream, modifiers, input);

      // dispatch the result only if the generator was not ended
      if (!done) {
        value
          .then(
            res => dispatch(success, res),
            err => dispatch(errors, err)
          );
      }

      return this
    },
    fork() {
      return erre(...Array.from(modifiers))
    }
  }
}

return erre;

})));
