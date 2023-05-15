import test from 'ava'
import { rm } from 'fs/promises'
import {
  getFileDescriptors,
  loadPreviousHtml,
  writeHtml,
  getRemoteDiff,
} from './get-remote-diff.js'

const basePath = '__data'

test.beforeEach('tests', async _ => {
  try {
    await rm(basePath, { recursive: true })
  } catch (err) {}
})

test.serial('Should load a new remote resource', async t => {
  const href = process.env.TEST_HREF
  const selector = 'tr'
  const opts = { basePath }
  const changes = await getRemoteDiff(href, selector, opts)

  t.is(changes.existing, false)
  t.true(changes.changed > 0)
  t.is(changes.added.length, 0)
  t.is(changes.removed.length, 0)
})

test.serial('Should report changes for a tracked resource', async t => {
  const href = process.env.TEST_HREF
  const selector = 'tr'
  const opts = { basePath }
  const changes = await getRemoteDiff(href, selector, opts)

  t.is(changes.existing, false)
  t.true(changes.changed > 0)
  t.is(changes.added.length, 0)
  t.is(changes.removed.length, 0)

  const { directory, filename } = getFileDescriptors(basePath, href)
  const previous = await loadPreviousHtml(directory, filename)
  const modifiedPrevious = previous.split('\n').slice(6).join('\n') // remove first 6 lines
  await writeHtml(directory, filename, modifiedPrevious)
  const newChanges = await getRemoteDiff(href, selector, opts)

  t.is(newChanges.existing, true)
  t.true(newChanges.changed > 0)
  t.is(newChanges.added.length, 1)
  t.is(newChanges.removed.length, 0)
})
