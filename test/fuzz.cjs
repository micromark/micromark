const {micromark} = require('./fuzz-bundle.cjs')

exports.fuzz = fuzz

/**
 * @param {Buffer} buf
 *   Input.
 * @returns {undefined}
 *   Nothing.
 */
function fuzz(buf) {
  // Buffer.
  micromark(buf)
}
