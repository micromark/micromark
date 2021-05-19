/**
 * @typedef {import('../types.js').NormalizedExtension} NormalizedExtension
 * @typedef {import('../types.js').Extension} Extension
 * @typedef {import('../types.js').Construct} Construct
 */

import {hasOwnProperty} from '../constant/has-own-property.js'
import {chunkedSplice} from './chunked-splice.js'

/**
 * Combine several syntax extensions into one.
 *
 * @param {Extension[]} extensions List of syntax extensions.
 * @returns {NormalizedExtension} A single combined extension.
 */
export function combineExtensions(extensions) {
  /** @type {NormalizedExtension} */
  const all = {}
  let index = -1

  while (++index < extensions.length) {
    extension(all, extensions[index])
  }

  return all
}

/**
 * Merge `extension` into `all`.
 *
 * @param {NormalizedExtension} all Extension to merge into.
 * @param {Extension} extension Extension to merge.
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
    let code

    for (code in right) {
      if (!hasOwnProperty.call(left, code)) left[code] = []
      const value = right[code]
      constructs(
        left[code],
        Array.isArray(value) ? value : value ? [value] : []
      )
    }
  }
}

/**
 * Merge `list` into `existing` (both lists of constructs).
 * Mutates `existing`.
 *
 * @param {unknown[]} existing
 * @param {unknown[]} list
 * @returns {void}
 */
function constructs(existing, list) {
  let index = -1
  /** @type {unknown[]} */
  const before = []

  while (++index < list.length) {
    // @ts-expect-error Looks like an object.
    ;(list[index].add === 'after' ? existing : before).push(list[index])
  }

  chunkedSplice(existing, 0, 0, before)
}
