import ruit from 'ruit'

// Symbol used to end the stream
const API_METHODS = new Set()

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
    panic('Please provide a name (as string) for your erre plugin')
  if (!fn || typeof fn !== 'function')
    panic('Please provide a function for your erre plugin')

  if (API_METHODS.has(name)) {
    panic(`The ${name} is already part of the erre API, please provide a different name`)
  } else {
    erre[name] = fn
    API_METHODS.add(name)
  }

  return erre
}

// alias for ruit canel to stop a stream chain
erre.install('cancel', ruit.cancel)

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
      // dispatch the end event
      dispatch(end)
      // kill the stream
      generator.return()
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