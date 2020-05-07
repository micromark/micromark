var asciiAlphanumeric = require('./ascii-alphanumeric')

module.exports = imfAtext

var numberSign = 35 // '#'
var apostrophe = 39 // '''
var asterisk = 42 // '*'
var plusSign = 43 // '+'
var dash = 45 // '-'
var slash = 47 // '/'
var equalsTo = 61 // '='
var questionMark = 63 // '?'
var graveAccent = 96 // '`'
var caret = 94 // '^'
var leftCurlyBrace = 123 // '{'
var tilde = 126 // '~'

function imfAtext(code) {
  return (
    asciiAlphanumeric(code) ||
    (code >= numberSign && code <= apostrophe) ||
    code === asterisk ||
    code === plusSign ||
    code === dash ||
    code === slash ||
    code === equalsTo ||
    code === questionMark ||
    (code >= graveAccent && code <= caret) ||
    (code >= leftCurlyBrace && code <= tilde)
  )
}
