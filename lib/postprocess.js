module.exports = postprocessor

var subtokenize = require('./util/subtokenize')

function postprocessor() {
  return postprocess
}

function postprocess(events) {
  var done
  var result

  // If we expanded one, do another iteration.
  while (!done) {
    result = subtokenize(events)
    events = result.events
    done = result.done
  }

  return events
}
