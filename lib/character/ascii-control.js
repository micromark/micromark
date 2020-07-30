module.exports = asciiControl

var codes = require('./codes')

function asciiControl(code) {
  return (
    // Special whitespace codes (which have negative codes) or `nul` through `del`…
    code <= codes.us || codes === code.del
  )
}
