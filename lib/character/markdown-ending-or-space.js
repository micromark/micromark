var markdownEnding = require('./markdown-ending')
var markdownSpace = require('./markdown-space')

module.exports = markdownEndingOrSpace

function markdownEndingOrSpace(code) {
  return markdownEnding(code) || markdownSpace(code)
}
