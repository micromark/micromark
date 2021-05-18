/**
 * @typedef {import('./types.js').Event} Event
 */

import {subtokenize} from './util/subtokenize.js'

/**
 * @param {Event[]} events
 * @returns {Event[]}
 */
export function postprocess(events) {
  while (!subtokenize(events)) {
    // Empty
  }

  return events
}
