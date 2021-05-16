import {subtokenize} from './util/subtokenize.js'

export function postprocess(events) {
  while (!subtokenize(events)) {
    // Empty
  }

  return events
}
