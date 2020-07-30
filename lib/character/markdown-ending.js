module.exports = markdownEnding

var codes = require('./codes')
var markdownLineEnding = require('./markdown-line-ending')

function markdownEnding(code) {
  return code === codes.eof || markdownLineEnding(code)
}
