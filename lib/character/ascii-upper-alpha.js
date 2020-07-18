var codes = require('./codes')

module.exports = asciiUpperAlpha

function asciiUpperAlpha(code) {
  return code >= codes.uppercaseA && code <= codes.uppercaseZ
}
