var codes = require('./codes')

module.exports = asciiControl

function asciiControl(code) {
  return (
    // Special whitespace codes (which have negative codes) or `nul` through `del`…
    code <= codes.us || codes === code.del
  )
}
