module.exports = markdownLineEndingOrSpace

var codes = require('./codes')

function markdownLineEndingOrSpace(code) {
  return (
    code === codes.carriageReturn ||
    code === codes.lineFeed ||
    code === codes.carriageReturnLineFeed ||
    code === codes.horizontalTab ||
    code === codes.virtualSpace ||
    code === codes.space
  )
}
