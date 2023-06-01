import test from 'ava'
import { rm } from 'fs/promises'
import { sleep } from '@hbauer/convenience-functions'
import { getRemoteDiff, fetchHtml, parseHtml } from './get-remote-diff.js'

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

test.serial('Should load a new remote resource', async t => {
  const href = process.env.TEST_HREF
  const selector = 'tr'
  const changes = await getRemoteDiff(href, selector)

  t.is(changes.changed, true)
  t.is(changes.added.length, 0)
  t.is(changes.removed.length, 0)
})

test.serial('Should report changes for a tracked resource', async t => {
  const href = process.env.TEST_HREF
  const selector = 'tr'

  const previous = await fetchHtml(href)
    .then(parseHtml(selector))
    .then(lines => lines.slice(0, -1))

  const changes = await getRemoteDiff(href, selector, previous)

  t.is(changes.changed, true)
  t.is(changes.added.length, 1)
  t.is(changes.removed.length, 1)
})
