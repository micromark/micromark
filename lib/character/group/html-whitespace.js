module.exports = htmlWhitespace

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var formFeed = 12 // '\f'
var carriageReturn = 13 // '\r'
var space = 32 // ' '

function htmlWhitespace(code) {
  return (
    code === tab ||
    code === lineFeed ||
    code === formFeed ||
    code === carriageReturn ||
    code === space
  )
}
