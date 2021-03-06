let micromark
let promise = import('micromark').then((d) => {
  promise = undefined
  micromark = d.micromark
})

exports.fuzz = fuzz

/**
 * @param {Buffer} buf
 */
function fuzz(buf) {
  if (promise) {
    // Queue
    promise.then(() => fuzz(buf))
  } else {
    // Buffer.
    micromark(buf)
  }
}
