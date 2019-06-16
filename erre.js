(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.erre = factory());
}(this, function () { 'use strict';

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
  function ruit(...tasks) {
    return new Promise((resolve, reject) => {
      return (function run(queue, result) {
        if (!queue.length) return resolve(result)

        const [task, ...rest] = queue;
        const value = typeof task === 'function' ? task(result) : task;
        const done = v => run(rest, v);

        // check against nil values
        if (value != null) {
          if (value === CANCEL) return
          if (value.then) return value.then(done, reject)
        }

        return Promise.resolve(done(value))
      })(tasks)
    })
  }

  // Store the erre the API methods to handle the plugins installation
  const API_METHODS = new Set();
  const UNSUBSCRIBE_SYMBOL = Symbol();
  const UNSUBSCRIBE_METHOD = 'off';
  const CANCEL_METHOD = 'cancel';

  /**
   * Factory function to create the stream generator
   * @private
   * @param {Set} modifiers - stream input modifiers
   * @returns {Generator} the stream generator
   */
  function createStream(modifiers) {
    const stream = (function *stream() {
      while (true) {
        // get the initial stream value
        const input = yield;

        // run the input sequence
        yield ruit(input, ...modifiers);
      }
    })();

    // start the stream
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
    callbacks.forEach(f => {
      // unsubscribe the callback if erre.unsubscribe() will be returned
      if (f(value) === UNSUBSCRIBE_SYMBOL) callbacks.delete(f);
    });

    return callbacks
  }

  /**
   * Throw a panic error
   * @param {string} message - error message
   * @returns {Error} an error object
   */
  function panic(message) {
    throw new Error(message)
  }

  /**
   * Install an erre plugin adding it to the API
   * @param   {string} name - plugin name
   * @param   {Function} fn - new erre API method
   * @returns {Function} return the erre function
   */
  erre.install = function(name, fn) {
    if (!name || typeof name !== 'string')
      panic('Please provide a name (as string) for your erre plugin');
    if (!fn || typeof fn !== 'function')
      panic('Please provide a function for your erre plugin');

    if (API_METHODS.has(name)) {
      panic(`The ${name} is already part of the erre API, please provide a different name`);
    } else {
      erre[name] = fn;
      API_METHODS.add(name);
    }

    return erre
  };

  // alias for ruit canel to stop a stream chain
  erre.install(CANCEL_METHOD, ruit.cancel);

  // unsubscribe helper
  erre.install(UNSUBSCRIBE_METHOD, () => UNSUBSCRIBE_SYMBOL);

  /**
   * Stream constuction function
   * @param   {...Function} fns - stream modifiers
   * @returns {Object} erre instance
   */
  function erre(...fns) {
    const
      [success, error, end, modifiers] = [new Set(), new Set(), new Set(), new Set(fns)],
      generator = createStream(modifiers),
      stream = Object.create(generator),
      addToCollection = (collection) => (fn) => collection.add(fn) && stream,
      deleteFromCollection = (collection) => (fn) => collection.delete(fn) ? stream
        : panic('Couldn\'t remove handler passed by reference');

    return Object.assign(stream, {
      on: Object.freeze({
        value: addToCollection(success),
        error: addToCollection(error),
        end: addToCollection(end)
      }),
      off: Object.freeze({
        value: deleteFromCollection(success),
        error: deleteFromCollection(error),
        end: deleteFromCollection(end)
      }),
      connect: addToCollection(modifiers),
      push(input) {
        const { value, done } = stream.next(input);

        // dispatch the stream events
        if (!done) {
          value.then(
            res => dispatch(success, res),
            err => dispatch(error, err)
          );
        }

        return stream
      },
      end() {
        // kill the stream
        generator.return();
        // dispatch the end event
        dispatch(end)
        // clean up all the collections
        ;[success, error, end, modifiers].forEach(el => el.clear());

        return stream
      },
      fork() {
        return erre(...modifiers)
      },
      next(input) {
        // get the input and run eventually the promise
        const result = generator.next(input);

        // pause to the next iteration
        generator.next();

        return result
      }
    })
  }

  return erre;

}));
