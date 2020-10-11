exports.fuzz = fuzz

var m = require('..')

function fuzz(buf) {
  // Buffer.
  m(buf)

  // An encoding.
  m(buf, 'ascii')

  // Options.
  m(buf, {allowDangerousHtml: true, allowDangerousProtocol: true})
}
