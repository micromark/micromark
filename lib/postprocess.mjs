export default postprocess

import subtokenize from './util/subtokenize'

function postprocess(events) {
  while (!subtokenize(events)) {
    // Empty
  }

  return events
}
