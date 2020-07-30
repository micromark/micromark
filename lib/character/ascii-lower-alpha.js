module.exports = asciiLowerAlpha

var codes = require('./codes')

function asciiLowerAlpha(code) {
  return code >= codes.lowercaseA && code <= codes.lowercaseZ
}
