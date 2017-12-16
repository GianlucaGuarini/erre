const assert = require('assert')
const erre = require('./erre')

const add = (a, b) => a + b
const multiply = (a, b) => a * b

describe('erre', () => {
  it('can listen and dispatch simple events', (done) => {
    const stream = erre()
    const startValue = 1

    stream
      .onValue((value) => {
        assert.equal(startValue, value)
        done()
      })
      .push(startValue)
  })

  it('can listen and dispatch multiple events', (done) => {
    const stream = erre()
    const startValue = 1
    const eventsAmount = 4
    let currentEventId = 0

    stream
      .onValue((value) => {
        currentEventId ++
        assert.equal(startValue, value)
        if (currentEventId === eventsAmount) done()
      })
      .push(startValue)
      .push(startValue)
      .push(startValue)
      .push(startValue)
  })

  it('can catch errors', (done) => {
    const stream = erre((val) => {
      throw 'error'
    })

    const startValue = 1

    stream
      .onError((value) => {
        done()
      })
      .push(startValue)
  })

  it('can catch async rejections', (done) => {
    const stream = erre((val) => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          reject('error')
        }, 200)
      })
    })

    const startValue = 1

    stream
      .onError((value) => {
        done()
      })
      .push(startValue)
  })

  it('can modify an input', (done) => {
    const stream = erre((val) => add(val, 1))
    const startValue = 1
    const expectedValue = 2

    stream
      .onValue((value) => {
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

    stream
      .onValue((value) => {
        assert.equal(value, expectedValue)
        done()
      })
      .push(startValue)
  })

  it('can be ended properly', () => {
    const stream = erre()
    const startValue = 1

    stream
      .onValue((value) => {
        throw 'it should never be called if the stream was ended'
      })
      .end()
      .push(startValue)
  })

  it('can be enhanced', (done) => {
    const stream = erre((val) => add(val, 1))
    const startValue = 1
    const expectedValue = 4

    stream.enhance(val => multiply(val, 2))

    stream
      .onValue((value) => {
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

    stream.enhance(val => multiply(val, 2))

    fork
      .onValue((value) => {
        assert.equal(value, expectedValue)
        done()
      })
      .push(startValue)
  })
})