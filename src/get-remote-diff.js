import { load as loadHtml } from 'cheerio'
import { diffLines } from 'diff'

/**
 * @typedef {import('./types.js').ResourceChangeResponse} ResourceChangeResponse
 */

/**
 * @param {string} href
 */
export const fetchHtml = async href => {
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
export const parseHtml = selector => html => {
  const $ = loadHtml(html)

  let outerHTML = ''

  $(selector).each((_, element) => {
    outerHTML += $(element)
      .text()
      .trim()
      .replaceAll(/\t/g, '  ')
      .replaceAll(/\s\s+/g, '\n')
    outerHTML += '\n'
  })

  return outerHTML
}

/**
 * @param {Diff.Change[]} diff
 * @returns {{ added: string[], removed: string[] }}
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
 * @param {string} [previous]
 * @returns {Promise<ResourceChangeResponse>}
 */
export const getRemoteDiff = async (href, selector, previous) => {
  const current = await fetchHtml(href).then(parseHtml(selector))

  if (previous == null) {
    return {
      changed: true,
      added: [],
      removed: [],
    }
  }

  const diff = diffLines(previous, current)
  const { added, removed } = parseDiff(diff)

  if (added.length || removed.length) {
    return {
      changed: true,
      added,
      removed,
    }
  }

  return {
    changed: false,
    added,
    removed,
  }
}
