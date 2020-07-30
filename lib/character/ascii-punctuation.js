module.exports = asciiPunctuation

var codes = require('./codes')

function asciiPunctuation(code) {
  return (
    (code > codes.space && code < codes.digit0) ||
    (code > codes.digit9 && code < codes.uppercaseA) ||
    (code > codes.uppercaseZ && code < codes.lowercaseA) ||
    (code > codes.lowercaseZ && code < codes.del)
  )
}
