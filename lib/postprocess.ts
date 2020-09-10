import subtokenize from './util/subtokenize'

export default function postprocessor() {
  return postprocess
}

function postprocess(events: any) {
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
