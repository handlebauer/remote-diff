import test from 'ava'
import { rm } from 'fs/promises'
import { sleep } from '@hbauer/convenience-functions'
import { getRemoteDiff } from './get-remote-diff.js'

const basePath = '__data'

test.beforeEach('tests', async _ => {
  try {
    await rm(basePath, { recursive: true })
    await sleep(100)
  } catch (err) {}
})

test.after('tests', async _ => {
  try {
    await sleep(100)
    await rm(basePath, { recursive: true })
  } catch (err) {}
})

test.serial('Should return defaults for a new resource', t => {
  const current = '<div><ul><li>1</li><li>2</li></ul></div>'

  const selector = 'li'
  const changes = getRemoteDiff(null, current, selector)

  t.is(changes.changed, true)
  t.is(changes.added.length, 0)
  t.is(changes.removed.length, 0)
})

test.serial('Should report no changes for an identical resource', t => {
  const selector = 'li'

  const previous = '<div><ul><li>1</li><li>2</li></ul></div>'
  const current = '<div><ul><li>1</li><li>2</li></ul></div>'

  const changes = getRemoteDiff(previous, current, selector)

  t.is(changes.changed, false)
  t.is(changes.added.length, 0)
  t.is(changes.removed.length, 0)
})

test.serial('Should report additions', t => {
  const selector = 'li'

  const previous = '<div><ul><li>1</li><li>2</li></ul></div>'
  const current = '<div><ul><li>1</li><li>2</li><li>3</li></ul></div>'

  const changes = getRemoteDiff(previous, current, selector)

  t.is(changes.changed, true)
  t.is(changes.added.length, 1)
  t.is(changes.removed.length, 0)
})

test.serial('Should report removals', t => {
  const selector = 'li'

  const previous = '<div><ul><li>1</li><li>2</li></ul></div>'
  const current = '<div><ul><li>1</li></ul></div>'

  const changes = getRemoteDiff(previous, current, selector)

  t.is(changes.changed, true)
  t.is(changes.added.length, 0)
  t.is(changes.removed.length, 1)
})
