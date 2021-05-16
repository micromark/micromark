exports.fuzz = fuzz

var {micromark} = require('..')

function fuzz(buf) {
  // Buffer.
  micromark(buf)
}
