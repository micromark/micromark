var unicodePunctuation = require('../constant/unicode-punctuation-regex')
var test = require('../util/character-test-from-expression')

// Size note: removing ASCII from the regex and using `ascii-punctuation` here
// In fact adds to the bundle size.
module.exports = test(unicodePunctuation)
