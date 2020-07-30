module.exports = asciiControl

var codes = require('./codes')

// Note: `EOF` is seen as ASCII control here, because `null < 32 == true`.
function asciiControl(code) {
  return (
    // Special whitespace codes (which have negative codes) or `nul` through `del`…
    code < codes.space || codes === code.del
  )
}
