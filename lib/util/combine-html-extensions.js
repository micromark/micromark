/**
 * @typedef {import('../types.js').HtmlExtension} HtmlExtension
 */

const hasOwnProperty = {}.hasOwnProperty

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
    const maybe = hasOwnProperty.call(all, hook) ? all[hook] : undefined
    const left = maybe || (all[hook] = {})
    const right = extension[hook]
    /** @type {string} */
    let type

    if (right) {
      for (type in right) {
        left[type] = right[type]
      }
    }
  }
}
