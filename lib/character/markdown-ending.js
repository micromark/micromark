module.exports = markdownEnding

var codes = require('./codes')

function markdownEnding(code) {
  return (
    code === codes.eof ||
    code === codes.cr ||
    code === codes.lf ||
    code === codes.crlf
  )
}
