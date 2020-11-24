exports.fuzz = fuzz

var m = require('..')

function fuzz(buf) {
  // Buffer.
  m(buf)
}
