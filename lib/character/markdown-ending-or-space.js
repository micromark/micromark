module.exports = markdownEndingOrSpace

var codes = require('./codes')

function markdownEndingOrSpace(code) {
  return (
    code === codes.eof ||
    code === codes.cr ||
    code === codes.lf ||
    code === codes.crlf ||
    code === codes.ht ||
    code === codes.vs ||
    code === codes.space
  )
}
