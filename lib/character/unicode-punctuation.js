var unicodePunctuation = require('../constant/unicode-punctuation-regex')
var test = require('../util/character-test-from-expression')

module.exports = test(unicodePunctuation)
