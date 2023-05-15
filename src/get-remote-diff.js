import { mkdir, writeFile, readFile } from 'fs/promises'
import { load as loadHtml } from 'cheerio'
import { diffLines } from 'diff'

/**
 * @param {string} basePath
 * @param {string} href
 */
export const getFileDescriptors = (basePath, href) => {
  const url = new URL(href)

  const host = url.host.split('.').join('-')
  const pathname = url.pathname.split('/').slice(1, -1).join('-')
  const directory = basePath + '/' + host + '/' + pathname

  const filename = url.pathname.split('/').at(-1)

  if (filename === '') {
    /**
     * If the href passed has no pathname, the parsed filename will be
     * empty, which isn't helpful to us. In this case, we use the `host`
     * value as the `filename` instead, and default to the `basePath`
     * for the value of `directory`.
     */
    return { directory: basePath, filename: host }
  }

  return { directory, filename }
}

/**
 * @param {string} directory
 * @param {string} filename
 */
export const loadPreviousHtml = async (directory, filename) => {
  try {
    return await readFile(directory + '/' + filename, 'utf-8')
  } catch (err) {
    if (err.code === 'ENOENT') return null // null: file doesn't exist
    throw new Error(err)
  }
}

/**
 * @param {string} href
 */
const fetchHtml = async href => {
  const response = await fetch(href)

  if (response.ok === false) {
    throw new Error(
      `Fetch to ${response.url} failed: ${response.status} (${response.statusText})`
    )
  }

  return response.text()
}

/**
 * @param {string} selector
 * @returns {(html: string) => string}
 */
const parseOuterHtml = selector => html => {
  const $ = loadHtml(html)

  let outerHTML = ''

  $(selector).each((_, element) => {
    outerHTML += $(element).text().trim().replace(/\t/g, '  ')
    outerHTML += '\n'
  })

  return outerHTML
}

/**
 * @param {string} directory
 * @param {string} filename
 * @param {string} html
 */
export const writeHtml = async (directory, filename, html) => {
  try {
    await mkdir(directory, { recursive: true })
    await writeFile(`${directory}/${filename}`, html)
  } catch (err) {
    throw new Error(err)
  }
}

/**
 * @param {Diff.Change[]} diff
 */
const parseDiff = diff =>
  diff.reduce(
    (acc, delta) => {
      if (delta.added) {
        return { ...acc, added: [...acc.added, delta.value] }
      }
      if (delta.removed) {
        return { ...acc, removed: [...acc.removed, delta.value] }
      }
      return acc
    },
    {
      added: /** @type {string[]} */ ([]),
      removed: /** @type {string[]} */ ([]),
    }
  )

/**
 * @param {string} href
 * @param {string} selector
 * @param {{ basePath?: string }} [opts]
 * @returns {Promise<ResourceChangeResponse>}
 */
export const getRemoteDiff = async (
  href,
  selector,
  { basePath = '.' } = {}
) => {
  const { directory, filename } = getFileDescriptors(basePath, href)

  const current = await fetchHtml(href).then(parseOuterHtml(selector))
  const previous = await loadPreviousHtml(directory, filename)

  if (previous === null) {
    await writeHtml(directory, filename, current)
    return {
      directory,
      filename,
      existing: false,
      changed: current.length,
      added: [],
      removed: [],
    }
  }

  const diff = diffLines(previous, current)
  const { added, removed } = parseDiff(diff)

  if (added.length || removed.length) {
    await writeHtml(directory, filename, current)
    return {
      directory,
      filename,
      existing: true,
      changed: current.length - previous.length,
      added,
      removed,
    }
  }

  return {
    directory,
    filename,
    existing: true,
    changed: 0,
    added,
    removed,
  }
}
