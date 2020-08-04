module.exports = markdownEndingOrSpace

var codes = require('./codes')

function markdownEndingOrSpace(code) {
  return (
    code === codes.eof ||
    code === codes.carriageReturn ||
    code === codes.lineFeed ||
    code === codes.carriageReturnLineFeed ||
    code === codes.horizontalTab ||
    code === codes.virtualSpace ||
    code === codes.space
  )
}
