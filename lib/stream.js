'use strict'

var EventEmitter = require('events').EventEmitter
var once = require('once')
var m = require('./core')
var preprocessor = require('./preprocess')
var html = require('./html-adapter')

module.exports = stream

function stream() {
  var tokenizer = m.flow()
  var preprocess = preprocessor()
  var adapter = html()
  var emitter = new EventEmitter()
  var ended = false

  emitter.readable = true
  emitter.writable = true
  emitter.write = write
  emitter.end = end
  emitter.pipe = pipe

  return emitter

  // Write a chunk into memory.
  function write(chunk, encoding, callback) {
    var value
    var tokens

    if (typeof encoding === 'function') {
      callback = encoding
      encoding = null
    }

    if (ended) {
      throw new Error('Did not expect `write` after `end`')
    }

    value = (chunk || '').toString(encoding || 'utf8')
    tokens = preprocess(value).flatMap(tokenizer)
    emitter.emit('data', adapter(tokens))

    if (callback) {
      callback()
    }

    // Signal succesful write.
    return true
  }

  // End the writing.
  // Passes all arguments to a final `write`.
  function end() {
    write.apply(null, arguments)

    emitter.emit('data', adapter(preprocess(null).flatMap(tokenizer)))
    emitter.emit('end')

    ended = true

    return true
  }

  // Pipe the processor into a writable stream.
  // Basically `Stream#pipe`, but inlined and simplified to keep the bundled
  // size down.
  // See: <https://github.com/nodejs/node/blob/43a5170/lib/internal/streams/legacy.js#L13>.
  function pipe(dest, options) {
    var settings = options || {}
    var onend = once(onended)

    emitter.on('data', ondata)
    emitter.on('error', onerror)
    emitter.on('end', cleanup)
    emitter.on('close', cleanup)

    // If the `end` option is not supplied, `dest.end()` will be called when the
    // `end` or `close` events are received
    // Only `dest.end()` once.
    if (!dest._isStdio && settings.end !== false) {
      emitter.on('end', onend)
    }

    dest.on('error', onerror)
    dest.on('close', cleanup)

    dest.emit('pipe', emitter)

    return dest

    // End destination.
    function onended() {
      if (dest.end) {
        dest.end()
      }
    }

    // Handle data.
    function ondata(chunk) {
      if (dest.writable) {
        dest.write(chunk)
      }
    }

    // Clean listeners.
    function cleanup() {
      emitter.removeListener('data', ondata)
      emitter.removeListener('end', onend)
      emitter.removeListener('error', onerror)
      emitter.removeListener('end', cleanup)
      emitter.removeListener('close', cleanup)

      dest.removeListener('error', onerror)
      dest.removeListener('close', cleanup)
    }

    // Close dangling pipes and handle unheard errors.
    function onerror(err) {
      var handlers = emitter._events.error

      cleanup()

      // Cannot use `listenerCount` in node <= 0.12.
      if (!handlers || handlers.length === 0 || handlers === onerror) {
        throw err // Unhandled stream error in pipe.
      }
    }
  }
}
