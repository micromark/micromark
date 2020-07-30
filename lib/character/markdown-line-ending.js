module.exports = markdownLineEnding

var codes = require('./codes')

function markdownLineEnding(code) {
  return code === codes.cr || code === codes.lf || code === codes.crlf
}
