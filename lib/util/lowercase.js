module.exports = lowercase

var asciiUpperAlpha = require('../character/ascii-upper-alpha')

function lowercase(code) {
  return asciiUpperAlpha(code) ? code + 0x20 : code
}
