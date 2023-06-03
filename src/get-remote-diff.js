import { load as loadHtml } from 'cheerio'
import { diffLines } from 'diff'

/**
 * @typedef {import('./types.js').ResourceChangeResponse} ResourceChangeResponse
 */

/**
 * @param {string} html
 * @param {string} selector
 */
export const parseHtml = (html, selector) => {
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
 * @param {string} previous previous HTML
 * @param {string} current current HTML
 * @param {string} [selector] element selector
 * @returns {ResourceChangeResponse}
 */
export const getRemoteDiff = (previous, current, selector) => {
  if (previous == null) {
    return {
      changed: true,
      added: [],
      removed: [],
    }
  }

  previous = parseHtml(previous, selector)
  current = parseHtml(current, selector)

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
