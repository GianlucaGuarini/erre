# erre

[![Build Status][travis-image]][travis-url]

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]

## Description

Erre is a modern, performant and tiny (~500 bytes minified) streams script using generators.
It can be used to manage any kind of sync and async event series and it's inspired to bigger libraries like:
  - [baconjs](https://baconjs.github.io/)
  - [RxJS](http://reactivex.io/rxjs/)


## Usage

You can use it to create and manipulate simple event streams

```js
import erre from 'erre'

const stream = erre(
  string => string.toUpperCase(),
  string => [...string].reverse().join('')
)

stream.onValue(val => console.log(val)) // EVOL, ETAH

stream.push('love')
stream.push('hate')
```

It supports async and sync event chains thanks to [ruit](https://github.com/GianlucaGuarini/ruit)

```js
const usernNamesStream = erre(
  async user => await updateUsers(user), // async function returning user collections
  users => users.map(user => user.name)
)

usernNamesStream.onValue(val => console.log(val))

usernNamesStream.push({
  name: 'John',
  role: 'Doctor',
  age: 24
})
```

## API

[travis-image]:https://img.shields.io/travis/GianlucaGuarini/erre.svg?style=flat-square
[travis-url]:https://travis-ci.org/GianlucaGuarini/erre

[license-image]:http://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:LICENSE

[npm-version-image]:http://img.shields.io/npm/v/erre.svg?style=flat-square
[npm-downloads-image]:http://img.shields.io/npm/dm/erre.svg?style=flat-square
[npm-url]:https://npmjs.org/package/erre

## API

