module.exports = serializeChunks

var assert = require('assert')
var codes = require('../character/codes')
var values = require('../character/values')
var fromCharCode = require('../constant/from-char-code')

function serializeChunks(chunks) {
  var length = chunks.length
  var index = -1
  var result = []
  var chunk
  var value
  var atTab

  while (++index < length) {
    chunk = chunks[index]

    if (typeof chunk === 'string') {
      value = chunk
    } else if (chunk === codes.crlf) {
      value = values.crlf
    } else if (chunk === codes.cr) {
      value = values.carriageReturn
    } else if (chunk === codes.lf) {
      value = values.lineFeed
    } else if (chunk === codes.ht) {
      value = values.tab
    } else if (chunk === codes.vs) {
      if (atTab) continue
      value = values.space
    } else {
      assert.equal(typeof chunk, 'number', 'expected number')
      // Currently only replacement character.
      value = fromCharCode(chunk)
    }

    atTab = chunk === codes.ht
    result.push(value)
  }

  return result.join('')
}
