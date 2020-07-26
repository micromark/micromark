var codes = require('../character/codes')
var fromCharCode = require('../constant/from-char-code')

module.exports = safeFromInt

function safeFromInt(value, base) {
  return fromCharCode(parseInt(value, base) || codes.replacementCharacter)
}
