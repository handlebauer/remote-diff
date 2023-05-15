# hbauer/remote-diff

## Install

```sh
$ yarn add @hbauer/remote-diff
$ npm install @hbauer/remote-diff
```

## Usage

```js
import { getRemoteDiff } from '@hbauer/remote-diff'

const href = 'http://asdf.com'
const selection = 'p' // all <p> elements
const opts = { basePath: '_data' } // where would you like data stored?

const changes = await getRemoteDiff(href, selector, opts)

assert(changes.directory === '_data')
assert(changes.filename === 'asdf-com')
assert(changes.existing === false) // has this resource been previously fetched?
assert(changes.changed === 0) // # of characters changed
assert(changes.added.length === 0) // `added` is an array of strings that have been added
assert(changes.removed.length === 0) // `removed` is an array of strings that have been removed
```
