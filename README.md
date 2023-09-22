<img alt="erre.js" src="https://cdn.rawgit.com/GianlucaGuarini/erre/main/erre-logo.svg" width="50%"/>

[![Build Status][ci-image]][ci-url]

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

## Description

Erre is a modern, performant and tiny (~0.5kb minified) streams script using generators that runs on modern browsers and node.
It can be used to manage any kind of sync and async event series and it's inspired to bigger libraries like:
  - [baconjs](https://baconjs.github.io/)
  - [RxJS](http://reactivex.io/rxjs/)

## Installation

```sh
npm i erre -S
```

## Usage

You can use it to create and manipulate simple event streams

```js
import erre from 'erre'

const stream = erre(
  string => string.toUpperCase(),
  string => [...string].reverse().join('')
)

stream.on.value(console.log) // EVOL, ETAH

stream.push('love')
stream.push(async () => await 'hate') // async values
```

It supports async and sync event chains thanks to [ruit](https://github.com/GianlucaGuarini/ruit)

```js
const userNamesStream = erre(
  async user => await patchUsers(user), // async function returning a users collection
  users => users.map(user => user.name)
)

userNamesStream.on.value(console.log) // ['John'...]

userNamesStream.push({
  name: 'John',
  role: 'Doctor',
  age: 24
})
```

## API

### erre(...functions)
##### @returns [`stream`](#stream)

Create an `erre` stream object.
The initial `functions` list is optional and it represents the chain of async or sync events needed to generate the final stream output received via [`on.value`](#streamonvaluecallback) callbacks

### stream

It's an enhanced [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) object having additional API methods

#### stream.push(value)
##### @returns `stream`

Push a new value into the stream that will be asynchronously modified and returned as argument to [`stream.on.value`](#streamonvaluecallback) method

<details>
 <summary>Example</summary>

```js
const stream = erre()
stream.on.value(console.log) // 1
stream.push(1)
```

</details>

#### stream.on.value(callback)
##### @returns `stream`

Add a callback that will be called receiving the output of the stream asynchronously


<details>
 <summary>Example</summary>

```js
const stream = erre(val => val + 1)

stream.on.value(console.log) // 2
stream.on.value(val => console.log(val * 2)) // 4

stream.push(1)
```

</details>

#### stream.on.error(callback)
##### @returns `stream`

Add a callback that will be called in case of errors or promise rejections during the output generation

<details>
 <summary>Example</summary>

```js
const stream = erre(val => {
  throw 'error'
})

stream.on.value(console.log) // never called!!
stream.on.error(console.log) // 'error'

stream.push(1)
```

</details>

#### stream.on.end(callback)
##### @returns `stream`

Add a callback that will be called when the stream will be ended

<details>
 <summary>Example</summary>

```js
const stream = erre()

stream.on.end(() => console.log('ended!')) // ended!

stream.end()
```

</details>

#### stream.off.value(callback)
##### @returns `stream`
##### @throws `Error` if `callback` isn't registered

Removes a previously-registered callback

<details>
 <summary>Example</summary>

```js
const stream = erre()

const handler = (value) => console.log('handling', value)
stream.on.value(handler)
stream.push(1) // handler called, logs: handling 1

stream.off.value(handler)
stream.push(2) // handler is not called

// throws, because the handler is not registered
const someOtherHandler = () => console.log(`don't register me`)
stream.off.value(someOtherHandler)
```

</details>

#### stream.off.error(callback)
##### @returns `stream`
##### @throws `Error` if `callback` isn't registered

#### stream.off.end(callback)
##### @returns `stream`
##### @throws `Error` if `callback` isn't registered

#### stream.connect(function)
##### @returns `stream`

Enhance the stream adding a new operation to the functions chain to generate its output

<details>
 <summary>Example</summary>

```js
const stream = erre(val => val + 1)

stream.on.value(console.log) // 2, 4
stream.push(1)

// enhance the stream
stream.connect(val => val * 2)
stream.push(1)
```

</details>

#### stream.end()
##### @returns `stream`

End the stream

<details>
 <summary>Example</summary>

```js
const stream = erre(val => val + 1)

stream.on.value(console.log) // 2
stream.push(1)

// end the stream
stream.end()

// no more events
stream.push(1)
stream.push(1)
stream.push(1)
```

</details>

#### stream.fork()
##### @returns new `stream` object

Create a new stream object inheriting the function chain from its parent

<details>
 <summary>Example</summary>

```js
const stream = erre(val => val + 1)

stream.on.value(console.log) // 2, 3
stream.push(1)

const fork = stream.fork()
fork.on.value(console.log)
fork.connect(val => val * 10) // 20, 60

// 2 independent streams
fork.push(1)
stream.push(2)
fork.push(5)
```

</details>

#### stream.next(value)
##### @returns { done: true|false, value: Promise|undefined }

Run a single stream sequence (**without dispatching any event**) returning as `value` a promise result of the stream computation.
If the stream was ended the `done` value will be `true` and the `value` will be `undefined`.

<details>
 <summary>Example</summary>

```js
const stream = erre(val => val + 1)

stream.on.value(console.log) // never called

const { value } = stream.next(1)

value.then(console.log) // 2
```

</details>

### erre.cancel()

Static function that if returned by any of the stream functions chain can be used to filter or stop the computation

<details>
 <summary>Example</summary>

```js
const stream = erre(val => {
  if (typeof val !== 'number') return erre.cancel()
  return val + 1
})

stream.on.value(console.log) // 2, 3
stream.push(1)
stream.push('foo') // filtered
stream.push('1') // filtered
stream.push(2)
```

</details>

### erre.off()

Static function that if returned by any of the subscribed callbacks can be used to unsubscribe it

<details>
 <summary>Example</summary>

```js
const stream = erre(val => val + 1)

stream.on.value(val => {
  // if this condition will be matched, this callback will be unsubscribed
  if (typeof val !== 'number') return erre.off()
  console.log(val)
}) // 2
stream.push(1)
// this value will let the previous listener unsubscribe itself
stream.push('foo')
stream.push('1')
// this value will not be logged because the stream.on.value was unsubscribed
stream.push(2)
```

</details>

### erre.install(name, fn)
##### @returns [`erre`](#errefunctions)

Extend erre adding custom API methods. Any plugin must have at lease a `name` (as string) and a `function`

<details>
 <summary>Example</summary>

```js
// alias the `console.log` with `erre.log`
erre.install('log', console.log)

const stream = erre(val => val + 1)

stream.on.value(erre.log) // 2, 3
stream.push(1)
stream.push(2)
```

</details>

# TODO List

- [x] [erre.fromDOM](https://github.com/GianlucaGuarini/erre.fromDOM) - to stream DOM nodes events
- [x] [erre.merge](https://github.com/GianlucaGuarini/erre.merge) - to merge multiple stream results into one

[ci-image]: https://img.shields.io/github/actions/workflow/status/gianlucaguarini/erre/test.yml?style=flat-square
[ci-url]: https://github.com/gianlucaguarini/erre/actions

[license-image]:http://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:LICENSE

[npm-version-image]:http://img.shields.io/npm/v/erre.svg?style=flat-square
[npm-downloads-image]:http://img.shields.io/npm/dm/erre.svg?style=flat-square
[npm-url]:https://npmjs.org/package/erre

