var codes = require('./codes')

module.exports = asciiLowerAlpha

function asciiLowerAlpha(code) {
  return code >= codes.lowercaseA && code <= codes.lowercaseZ
}
