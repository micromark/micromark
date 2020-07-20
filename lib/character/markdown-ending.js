var codes = require('./codes')
var markdownLineEnding = require('./markdown-line-ending')

module.exports = markdownEnding

function markdownEnding(code) {
  return code === codes.eof || markdownLineEnding(code)
}
