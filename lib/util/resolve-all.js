module.exports = resolveAll

var miniflat = require('./miniflat')

function resolveAll(oneOrMoreConstructs, events, context) {
  var constructs = miniflat(oneOrMoreConstructs)
  var called = []
  var length = constructs.length
  var index = -1
  var resolve

  while (++index < length) {
    resolve = constructs[index].resolveAll

    if (resolve && called.indexOf(resolve) < 0) {
      events = resolve(events, context)
      called.push(resolve)
    }
  }

  return events
}
