var codes = require('./codes')

module.exports = markdownLineEnding

function markdownLineEnding(code) {
  return code === codes.cr || code === codes.lf || code === codes.crlf
}
