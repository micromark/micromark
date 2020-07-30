module.exports = markdownLineEndingOrSpace

var markdownLineEnding = require('./markdown-line-ending')
var markdownSpace = require('./markdown-space')

function markdownLineEndingOrSpace(code) {
  return markdownLineEnding(code) || markdownSpace(code)
}
