import m from '../index.js'

export function fuzz(buf) {
  // Buffer.
  m(buf)

  // An encoding.
  m(buf, 'ascii')

  // Options.
  m(buf, {allowDangerousHtml: true, allowDangerousProtocol: true})
}
