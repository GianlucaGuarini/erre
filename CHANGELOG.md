# erre

## 2.2.0
- added: unsubscription methods https://github.com/GianlucaGuarini/erre/issues/2

## 2.1.4
- updated: simplify the stream end event using the native `generator.return()` method

## 2.1.2

- updated: eslint config and the other dev dependencies
- fixed: all the `npm audit` issues

## 2.1.1

- added: `ruit` into the `erre` dependencies

## 2.1.0

- added: the `erre.install` method

## 2.0.1

- fixed: typos in the doc

## 2.0.0

- changed: all the `on*` API methods were linked to the `on` object for example: `onValue` => `on.value`
- added: the `next` method to run raw stream events without dispatching them to the listeners

## 1.2.0

- updated: return the stream generator extended with erre API methods

## 1.1.0

- added: `onEnd` method