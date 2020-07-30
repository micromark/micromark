module.exports = tokenizeEvent

var codes = require('../character/codes')
var flatMap = require('./flat-map')

function tokenizeEvent(event, createTokenizer) {
  return flatMap(
    event[2].sliceStream(event[1]).concat(codes.eof),
    createTokenizer(event[1].start)
  )
}
