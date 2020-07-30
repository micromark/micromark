module.exports = tokenizeEvent

var codes = require('../character/codes')
var flatMap = require('./flat-map')

function tokenizeEvent(event, createTokenizer) {
  var token = event[1]
  var context = event[2]
  return flatMap(
    context.sliceStream(token).concat(codes.eof),
    createTokenizer(token.start)
  )
}
