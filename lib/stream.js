var events = require('events')
var once = require('once')

function createStream() {
  return new Stream()
}

Stream.prototype.end = function () {
  console.log('end:', this, arguments)
}

Stream.prototype.write = streamWrite

Stream.prototype.close = function () {
  return this.write(null)
}

function Stream() {
  if (!(this instanceof Stream)) {
    return new Stream()
  }

  this.writable = true
  this.readable = true
}

// Write a chunk into memory.
function streamWrite(chunk, encoding, callback) {
  if (typeof encoding === 'function') {
    callback = encoding
    encoding = null
  }

  if (ended) {
    throw new Error('Did not expect `write` after `end`')
  }

  chunks.push((chunk || '').toString(encoding || 'utf8'))

  if (callback) {
    callback()
  }

  // Signal succesful write.
  return true
}

// mm.on = on
// mm.once = once
// mm.emit = emit
//
// function on() {
//   console.log('on:', this, arguments)
// }
// function once() {
//   console.log('once:', this, arguments)
// }
// function emit() {
//   console.log('emit:', this, arguments)
// }
