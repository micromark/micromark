module.exports = markdownEnding

var codes = require('./codes')

function markdownEnding(code) {
  return (
    code === codes.eof ||
    code === codes.carriageReturn ||
    code === codes.lineFeed ||
    code === codes.carriageReturnLineFeed
  )
}
