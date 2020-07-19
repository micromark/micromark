module.exports = tokenizeEvent

function tokenizeEvent(event, createTokenizer) {
  var token = event[1]
  var helpers = event[2]
  var tokenizer = createTokenizer(token.start)
  var stream = helpers.sliceStream(token).concat(null)
  var length = stream.length
  var index = -1
  var result = []

  while (++index < length) {
    result = result.concat(tokenizer(stream[index]))
  }

  return result
}
