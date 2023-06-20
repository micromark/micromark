import stream from 'node:stream'

const PassThrough = stream.PassThrough

/**
 * @param {Uint8Array | string} value
 * @param {BufferEncoding | undefined} [encoding]
 */
export function slowStream(value, encoding) {
  const stream = new PassThrough()
  let index = 0

  tick()

  return stream

  function send() {
    if (index === value.length) {
      stream.end()
    } else {
      stream.write(value.slice(index, ++index), encoding)
      tick()
    }
  }

  function tick() {
    setTimeout(send, 4)
  }
}
