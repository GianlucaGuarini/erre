import ruit from 'ruit'

// Symbol used to end the stream
const THE_END = Symbol()

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
      const input = yield

      // end the stream
      if (input === THE_END) {
        dispatch(end)
        return
      }

      // run the input sequence
      yield ruit(input, ...modifiers)
        .then(
          res => dispatch(success, res),
          err => dispatch(error, err)
        )
    }
  })()

  // init the stream
  stream.next()

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
  callbacks.forEach(f => f(value))
  return callbacks
}

// alias for ruit canel to stop a stream chain
erre.cancel = ruit.cancel

/**
 * Stream constuction function
 * @param   {...Function} fns - stream modifiers
 * @returns {Object} erre instance
 */
export default function erre(...fns) {
  const
    [success, error, end, modifiers] = [new Set(), new Set(), new Set(), new Set(fns)],
    stream = createStream(modifiers, success, error, end)

  return Object.assign(stream, {
    onValue(callback) {
      success.add(callback)
      return this
    },
    onError(callback) {
      error.add(callback)
      return this
    },
    onEnd(callback) {
      end.add(callback)
      return this
    },
    connect(fn) {
      modifiers.add(fn)
      return this
    },
    push(input) {
      // input
      stream.next(input)
      // discard the output promise
      stream.next()
      return this
    },
    end() {
      // kill the stream
      stream.next(THE_END)
      // clean up all the collections
      ;[success, error, end, modifiers].forEach(el => el.clear())
      return this
    },
    fork() {
      return erre(...modifiers)
    }
  })
}