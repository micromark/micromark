module.exports = slowStream

var stream = require('stream')

var PassThrough = stream.PassThrough

function slowStream(value, encoding) {
  var stream = new PassThrough()
  var index = 0

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
