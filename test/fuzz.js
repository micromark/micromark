exports.fuzz = fuzz

const {micromark} = require('..')

function fuzz(buf) {
  // Buffer.
  micromark(buf)
}
