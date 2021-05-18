/**
 * @typedef {import('../types.js').HtmlExtension} HtmlExtension
 */

import {hasOwnProperty} from '../constant/has-own-property.js'

/**
 * Combine several HTML extensions into one.
 *
 * @param {HtmlExtension[]} extensions List of HTML extensions.
 * @returns {HtmlExtension} A single combined extension.
 */
export function combineHtmlExtensions(extensions) {
  /** @type {HtmlExtension} */
  const handlers = {}
  let index = -1

  while (++index < extensions.length) {
    extension(handlers, extensions[index])
  }

  return handlers
}

/**
 * Merge `extension` into `all`.
 *
 * @param {HtmlExtension} all Extension to merge into.
 * @param {HtmlExtension} extension Extension to merge.
 * @returns {void}
 */
function extension(all, extension) {
  /** @type {string} */
  let hook

  for (hook in extension) {
    const left = hasOwnProperty.call(all, hook) ? all[hook] : (all[hook] = {})
    const right = extension[hook]
    /** @type {string} */
    let type

    for (type in right) {
      left[type] = right[type]
    }
  }
}
