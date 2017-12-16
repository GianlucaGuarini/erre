import ruit from 'ruit'

// Symbol used to end the stream
const THE_END = Symbol()

/**
 * Factory function to create the stream generator
 * @private
 * @generator
 * @yields  {Set|Promise} - the stream modifiers, and the async results
 * @returns {undefined} just end the stream
 */
function *createStream() {
  while (true) {
    // get the modifiers
    const modifiers = yield
    // get the initial stream value
    const input = yield
    // end the stream
    if (input === THE_END) return
    // execute the chain
    yield ruit(input, ...Array.from(modifiers))
  }
}

/**
 * Dispatch a value to several listeners
 * @private
 * @param   {Set} callbacks - callbacks collection
 * @param   {*} value - anything
 * @returns {Set} the callbacks received
 */
function dispatch(callbacks, value) {
  callbacks.forEach(f => f(value))
  return callbacks
}

/**
 * Execute a single stream event
 * @param   {Function} stream - stream generator
 * @param   {Set} modifiers - event modifiers collection
 * @param   {*} input - initial stream input
 * @yields  {Object} result
 * @returns {Boolean} result.done - generator done flag
 * @returns {Promise} result.value - async result
 */
function exec(stream, modifiers, input) {
  // start the next iteration
  stream.next()
  // pass the modifiers to the stream
  stream.next(modifiers)
  // execute the stream
  return stream.next(input)
}

// alias for ruit canel to stop a stream chain
erre.cancel = ruit.cancel

/**
 * Stream constuction function
 * @param   {...Function} fns - stream modifiers
 * @returns {Object} erre instance
 */
export default function erre(...fns) {
  const success = new Set()
  const errors = new Set()
  const modifiers = new Set(fns)
  const stream = createStream()

  return {
    onValue(callback) {
      success.add(callback)
      return this
    },
    onError(callback) {
      errors.add(callback)
      return this
    },
    connect(fn) {
      modifiers.add(fn)
      return this
    },
    push(input) {
      // execute the stream
      const { value, done } = exec(stream, modifiers, input)

      // dispatch the result only if the generator was not ended
      if (!done) {
        value
          .then(
            res => dispatch(success, res),
            err => dispatch(errors, err)
          )
      }

      return this
    },
    end() {
      // kill the stream
      exec(stream, modifiers, THE_END)

      // clean up all the collections
      success.clear()
      errors.clear()
      modifiers.clear()

      return this
    },
    fork() {
      return erre(...Array.from(modifiers))
    }
  }
}