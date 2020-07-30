module.exports = markdownLineEndingOrSpace

var codes = require('./codes')

function markdownLineEndingOrSpace(code) {
  return (
    code === codes.cr ||
    code === codes.lf ||
    code === codes.crlf ||
    code === codes.ht ||
    code === codes.vs ||
    code === codes.space
  )
}
