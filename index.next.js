import ruit from 'ruit'

// Symbol used to end the stream
const THE_END = Symbol()

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
      const input = yield

      // end the stream
      if (input === THE_END) return

      // run the input sequence
      yield ruit(input, ...modifiers)
    }
  })()

  // start the stream
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
    generator = createStream(modifiers),
    stream = Object.create(generator),
    addToCollection = (collection) => (fn) => collection.add(fn) && stream

  return Object.assign(stream, {
    on: Object.freeze({
      value: addToCollection(success),
      error: addToCollection(error),
      end: addToCollection(end)
    }),
    connect: addToCollection(modifiers),
    push(input) {
      const { value, done } = stream.next(input)

      // dispatch the stream events
      if (!done) {
        value.then(
          res => dispatch(success, res),
          err => dispatch(error, err)
        )
      }

      return stream
    },
    end() {
      // kill the stream
      stream.next(THE_END)
      // dispatch the end event
      dispatch(end)
      // clean up all the collections
      ;[success, error, end, modifiers].forEach(el => el.clear())

      return stream
    },
    fork() {
      return erre(...modifiers)
    },
    next(input) {
      // get the input and run eventually the promise
      const result = generator.next(input)

      // pause to the next iteration
      generator.next()

      return result
    }
  })
}