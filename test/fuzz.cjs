const {micromark} = require('./fuzz-bundle.cjs')

exports.fuzz = fuzz

/**
 * @param {Buffer} buf
 */
function fuzz(buf) {
  // Buffer.
  micromark(buf)
}
