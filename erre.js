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
 * @param {Set} modifiers - stream input modifiers
 * @param {Set} success - success callback functions
 * @param {Set} error - error callbak functions
 * @param {Set} end - end callbak functions
 * @returns {Generator} the stream generator
 */
function createStream(modifiers, success, error, end) {
  const stream = (function *stream() {
    while (true) {
      // get the initial stream value
      const input = yield;

      // end the stream
      if (input === THE_END) {
        dispatch(end);
        return
      }

      // run the input sequence
      yield ruit(input, ...modifiers)
        .then(
          res => dispatch(success, res),
          err => dispatch(error, err)
        );
    }
  })();

  // init the stream
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

// alias for ruit canel to stop a stream chain
erre.cancel = ruit.cancel;

/**
 * Stream constuction function
 * @param   {...Function} fns - stream modifiers
 * @returns {Object} erre instance
 */
function erre(...fns) {
  const
    [success, error, end, modifiers] = [new Set(), new Set(), new Set(), new Set(fns)],
    stream = createStream(modifiers, success, error, end);

  return Object.assign(stream, {
    onValue(callback) {
      success.add(callback);
      return this
    },
    onError(callback) {
      error.add(callback);
      return this
    },
    onEnd(callback) {
      end.add(callback);
      return this
    },
    connect(fn) {
      modifiers.add(fn);
      return this
    },
    push(input) {
      stream.next(input);
      stream.next();
      return this
    },
    end() {
      // kill the stream
      stream.next(THE_END)
      // clean up all the collections
      ;[success, error, end, modifiers].forEach(el => el.clear());
      return this
    },
    fork() {
      return erre(...modifiers)
    }
  })
}

return erre;

})));
