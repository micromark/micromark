module.exports = subtokenize

var codes = require('../character/codes')
var flatMap = require('./flat-map')

function subtokenize(events) {
  var length = events.length
  var index = -1
  var result = []
  var start = 0
  var event
  var token

  while (++index < length) {
    event = events[index]
    token = event[1]

    if (event[0] === 'enter' && token.contentType && !token._contentTokenized) {
      token._contentTokenized = true
      result = result.concat(
        events.slice(start, index + 1),
        flatMap(
          event[2].sliceStream(token).concat(codes.eof),
          event[2].parser[token.contentType](token.start)
        )
      )
      start = index + 1
    }
  }

  result = result.concat(events.slice(start))

  return {done: !start, events: result}
}
