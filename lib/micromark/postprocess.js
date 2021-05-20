/**
 * @typedef {import('./index.js').Event} Event
 */

import {subtokenize} from '../micromark-util-subtokenize/index.js'

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
