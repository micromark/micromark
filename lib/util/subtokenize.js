module.exports = subtokenize

var codes = require('../character/codes')
var flatMap = require('./flat-map')

function subtokenize(events) {
  var length = events.length
  var index = -1
  var result = []
  var start = 0
  var subevents
  var token

  if (events[length - 1] === codes.eof) {
    length--
  }

  while (++index < length) {
    token = events[index][1]

    if (token._subevents) {
      result = result.concat(events.slice(start, index), token._subevents)
      index++
      start = index + 1
    } else if (token.contentType && !token._contentTokenized) {
      token._contentTokenized = true
      subevents = flatMap(
        events[index][2].sliceStream(token).concat(codes.eof),
        events[index][2].parser[token.contentType](token.start)
      )
      result = result.concat(
        events.slice(start, index + 1),
        subevents.slice(0, -1)
      )
      start = index + 1
    }
  }

  result = result.concat(events.slice(start))

  return {done: !start, events: result}
}
