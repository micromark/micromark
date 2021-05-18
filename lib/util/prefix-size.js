/**
 * @typedef {import('../types.js').Event} Event
 * @typedef {import('../types.js').Type} Type
 */

import {sizeChunks} from './size-chunks.js'

/**
 * Get the size of the tail token (which has type `type`) of `events`.
 *
 * @param {Event[]} events
 * @param {Type} type
 * @returns {number}
 */
export function prefixSize(events, type) {
  const tail = events[events.length - 1]
  if (!tail || tail[1].type !== type) return 0
  return sizeChunks(tail[2].sliceStream(tail[1]))
}
