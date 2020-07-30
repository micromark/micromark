module.exports = punctuation

var unicodePunctuation = require('../constant/unicode-punctuation-regex')
var fromCharCode = require('../constant/from-char-code')

// Size note: removing ASCII from the regex and using `ascii-punctuation` here
// In fact adds to the bundle size.
function punctuation(code) {
  return unicodePunctuation.test(fromCharCode(code))
}
