module.exports = prefixSize

var assert = require('assert')
var types = require('../constant/types')

function prefixSize(events, type) {
  var kind = type || types.linePrefix
  var tail = events[events.length - 1]
  if (!tail || tail[1].type !== kind) return 0
  assert(typeof tail[1]._size === 'number', 'expected size')
  return tail[1]._size
}
