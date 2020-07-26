var codes = require('../character/codes')
var flatMap = require('./flat-map')

module.exports = tokenizeEvent

function tokenizeEvent(event, createTokenizer) {
  var token = event[1]
  var helpers = event[2]
  return flatMap(
    helpers.sliceStream(token).concat(codes.eof),
    createTokenizer(token.start)
  )
}
