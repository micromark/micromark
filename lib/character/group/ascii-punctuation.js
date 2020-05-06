module.exports = asciiPunctuation

var exclamationMark = 33 // '!'
var slash = 47 // '/'
var colon = 58 // ':'
var atSign = 64 // '@'
var leftSquareBracket = 91 // '['
var graveAccent = 96 // '`'
var leftCurlyBrace = 123 // '{'
var tilde = 126 // '~'

function asciiPunctuation(code) {
  return (
    (code >= exclamationMark && code <= slash) ||
    (code >= colon && code <= atSign) ||
    (code >= leftSquareBracket && code <= graveAccent) ||
    (code >= leftCurlyBrace && code <= tilde)
  )
}
