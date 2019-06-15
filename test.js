const assert = require('assert')
const erre = require('./erre')

const add = (a, b) => a + b
const multiply = (a, b) => a * b
const delay = (timeout) => new Promise(resolve => setTimeout(resolve, timeout))

describe('erre', () => {
  it('can listen and dispatch simple events', (done) => {
    const stream = erre()
    const startValue = 1

    stream.on
      .value((value) => {
        assert.equal(startValue, value)
        done()
      })
      .push(startValue)
  })

  it('can listen and dispatch multiple events', (done) => {
    const stream = erre()
    const startValue = 1
    const eventsAmount = 4
    const eventsIterator = {
      next() {
        this.id++
      },
      id: 0
    }

    stream.on
      .value((value) => {
        eventsIterator.next()
        assert.equal(startValue, value)
        if (eventsIterator.id === eventsAmount) done()
      })
      .push(startValue)
      .push(delay(100).then(() => startValue))
      .push(delay(40).then(() => startValue))
      .push(startValue)
  })

  it('can remove a subscriber by handler reference', (done) => {
    const stream = erre()
    const startValue = 1
    const eventsAmount = 1
    const eventsIterator = {
      next() {
        this.id++
      },
      id: 0
    }

    const cancelable = (value) => {
      eventsIterator.next()
      assert.equal(startValue, value)
      if (eventsIterator.id > eventsAmount)
        throw 'unsubscription never happened'
    }

    (async function() {
      stream.on.value(cancelable)
      stream.push(startValue)

      await delay(10)
      assert.equal(eventsIterator.id, 1)

      stream.off.value(cancelable)
      stream.push(startValue)

      await delay(10)
      assert.equal(eventsIterator.id, 1)

      done()
    })()
    .catch(e => done(e))
  })

  it('can cancel a stream chain', (done) => {
    const stream = erre(
      val => val === 1 ? erre.cancel() : val,
      val => add(val, 1)
    )

    const expectedValue = 3

    stream.on
      .value((value) => {
        assert.equal(expectedValue, value)
        done()
      })
      .push(1)
      .push(2)
  })

  it('can catch errors', (done) => {
    const stream = erre(() => {
      throw 'error'
    })

    const startValue = 1

    stream.on
      .error(() => {
        done()
      })
      .push(startValue)
  })

  it('can catch async rejections', (done) => {
    const stream = erre(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject('error')
        }, 200)
      })
    })

    const startValue = 1

    stream.on
      .error(() => {
        done()
      })
      .push(startValue)
  })

  it('can modify an input', (done) => {
    const stream = erre((val) => add(val, 1))
    const startValue = 1
    const expectedValue = 2

    stream.on
      .value((value) => {
        assert.equal(value, expectedValue)
        done()
      }).push(startValue)
  })

  it('can modify an input asynchronously', (done) => {
    const stream = erre((val) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(add(val, 1))
        }, 200)
      })
    })

    const startValue = 1
    const expectedValue = 2

    stream.on
      .value((value) => {
        assert.equal(value, expectedValue)
        done()
      })
      .push(startValue)
  })

  it('can be ended properly', (done) => {
    const stream = erre()
    const startValue = 1

    stream.on.end(() => done())

    stream.on
      .value(() => {
        throw 'it should never be called if the stream was ended'
      })
      .end()
      .push(startValue)
  })

  it('can be ended avoiding race condition issues', (done) => {
    const stream = erre()
    const startValue = 1

    stream.on.end(() => done())

    stream.on
      .value(() => {
        stream.end()
      })
      .push(startValue)
  })

  it('can be enhanced', (done) => {
    const stream = erre((val) => add(val, 1))
    const startValue = 1
    const expectedValue = 4

    stream.connect(val => multiply(val, 2))

    stream.on
      .value((value) => {
        assert.equal(value, expectedValue)
        done()
      })
      .push(startValue)
  })

  it('can be forked', (done) => {
    const stream = erre((val) => add(val, 1))
    const fork = stream.fork()
    const startValue = 1
    const expectedValue = 2

    stream.connect(val => multiply(val, 2))

    fork.on
      .value((value) => {
        assert.equal(value, expectedValue)
        done()
      })
      .push(startValue)
  })


  it('can be unsubscribed', done => {
    const results = []
    const stream = erre(val => add(val, 1))

    stream.on.value(val => {
      if (typeof val === 'string') return erre.unsubscribe()

      results.push(val)
    })

    stream
      .push(1)
      .push(2)
      .push(3)
      .push('hello')
      .push('world')
      .push(1)

    setTimeout(() => {
      assert.equal(results.length, 3)
      done()
    })
  })

  it('stream.next will not dispatch events', () => {
    const stream = erre((val) => add(val, 1))
    const startValue = 1
    const expectedValue = 2

    stream.on.value(() => {
      throw 'no events should be dispatched'
    })

    const { done, value } = stream.next(startValue)

    return value.then((val) => {
      assert.equal(val, expectedValue)
      assert.equal(done, false)
    })
  })

  it('stream.next will have undefined values if ended', () => {
    const stream = erre()
    const expectedValue = 2

    stream.end()

    const { done, value } = stream.next(() => {
      return expectedValue
    })

    assert.equal(done, true)
    assert.equal(value, undefined)
  })

  it('erre.install throws with wrong params', () => {
    assert.throws(erre.install, Error)
    assert.throws(erre.install.bind(null, 'foo'), Error)
    assert.throws(erre.install.bind(null, {}), Error)
    assert.throws(erre.install.bind(null, 'foo', {}), Error)
    assert.doesNotThrow(erre.install.bind(null, 'foo', () => {}), Error)
    assert.throws(erre.install.bind(null, 'foo', () => {}), Error)
    assert.ok(erre.foo)
  })
})