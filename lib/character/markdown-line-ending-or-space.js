var markdownLineEnding = require('./markdown-line-ending')
var markdownSpace = require('./markdown-space')

module.exports = markdownLineEndingOrSpace

function markdownLineEndingOrSpace(code) {
  return markdownLineEnding(code) || markdownSpace(code)
}
