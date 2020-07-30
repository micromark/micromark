module.exports = markdownEndingOrSpace

var markdownEnding = require('./markdown-ending')
var markdownSpace = require('./markdown-space')

function markdownEndingOrSpace(code) {
  return markdownEnding(code) || markdownSpace(code)
}
