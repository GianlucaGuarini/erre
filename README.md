# erre

[![Build Status][travis-image]][travis-url]

[![NPM version][npm-version-image]][npm-url]
[![NPM downloads][npm-downloads-image]][npm-url]
[![MIT License][license-image]][license-url]


## Usage

```js
import erre from 'erre'

const stream = erre(
  val => val.toUpperCase(),
  val => val.reverse()
)

stream.onValue(val => console.log(val)) // EVOL, ETAH

stream.push('love')
stream.push('hate')

```

[travis-image]:https://img.shields.io/travis/GianlucaGuarini/erre.svg?style=flat-square
[travis-url]:https://travis-ci.org/GianlucaGuarini/erre

[license-image]:http://img.shields.io/badge/license-MIT-000000.svg?style=flat-square
[license-url]:LICENSE

[npm-version-image]:http://img.shields.io/npm/v/erre.svg?style=flat-square
[npm-downloads-image]:http://img.shields.io/npm/dm/erre.svg?style=flat-square
[npm-url]:https://npmjs.org/package/erre

## API

