module.exports = prefixSize

var types = require('../constant/types')

function prefixSize(events, type) {
  var kind = type || types.linePrefix
  var tail = events[events.length - 1]
  return tail && tail[1].type === kind
    ? tail[1].end.column - tail[1].start.column
    : 0
}
