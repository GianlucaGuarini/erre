const Benchmark = require('benchmark'),
  erre = require('./'),
  suite = new Benchmark.Suite(),
  noop = function() {}

suite
  .add('create/destroy', function() {
    const stream = erre()
    stream.onValue(function() {
      stream.end()
    })
    stream.push('foo')
  })
  .add('stress', function() {
    const stream = erre(noop, noop, noop, noop)
    stream.onValue(noop.bind(null))
    stream.onEnd(noop)
    stream.onValue(noop.bind(null))
    stream.onError(noop.bind(null))
    stream.push('2')
    stream.push(undefined)
    stream.push(null)
    stream.push({})
    stream.push('bar')
    stream.push(Infinity)
    stream.push(NaN)
    stream.end()
  })
  .add('fork', function() {
    const stream = erre(noop, noop, noop, noop)
    stream.onValue(noop.bind(null))
    stream.onValue(noop.bind(null))
    stream.push('2')
    const fork = stream.fork()
    stream.end()
    fork.onValue(noop.bind(null))
    fork.push('foo')
    fork.end()
  })
  .on('cycle', function(event) {
    console.log(String(event.target))
  })
  .on('error', function(e) {
    console.log(e.target.error)
  })
  .run({async: true})