import {chunkedSplice} from './chunked-splice.js'

/**
 * Append `items` (an array) at the end of `list` (another array)
 * When `list` was empty, returns `items` instead.
 *
 * This prevents a potentially expensive operation when `list` is empty,
 * and adds items in batches to prevent V8 from hanging.
 *
 * @template {unknown} T
 * @param {T[]} list
 * @param {T[]} items
 * @returns {T[]}
 */
export function chunkedPush(list, items) {
  if (list.length > 0) {
    chunkedSplice(list, list.length, 0, items)
    return list
  }

  return items
}
