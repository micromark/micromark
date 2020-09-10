import {EventEmitter} from 'events'
import * as codes from './character/codes'
import compiler from './compile/html'
import flatMap from './util/flat-map'
import parser from './parse'
import preprocessor from './preprocess'
import postprocessor from './postprocess'

export default function stream(options: any) {
  var preprocess = preprocessor()
  var postprocess = postprocessor()
  var tokenize = parser().document().write
  var compile = compiler(options)
  var emitter = new EventEmitter()
  var ended: any

  emitter.readable = true
  emitter.writable = true
  emitter.write = write
  emitter.end = end
  emitter.pipe = pipe

  return emitter

  // Write a chunk into memory.
  function write(chunk: any, encoding: any, callback: any) {
    if (typeof encoding === 'function') {
      callback = encoding
      encoding = undefined
    }

    if (ended) {
      throw new Error('Did not expect `write` after `end`')
    }

    push(chunk || '', encoding)

    if (callback) {
      callback()
    }

    // Signal succesful write.
    return true
  }

  // End the writing.
  // Passes all arguments to a final `write`.
  function end(chunk: any, encoding: any, callback: any) {
    write(chunk, encoding, callback)
    push(codes.eof)
    emitter.emit('end')
    ended = true
    return true
  }

  function push(data: any, encoding?: string) {
    emitter.emit(
      'data',
      compile(postprocess(flatMap(preprocess(data, encoding), tokenize)))
    )
  }

  // Pipe the processor into a writable stream.
  // Basically `Stream#pipe`, but inlined and simplified to keep the bundled
  // size down.
  // See: <https://github.com/nodejs/node/blob/43a5170/lib/internal/streams/legacy.js#L13>.
  function pipe(dest: any, options: any) {
    emitter.on('data', ondata)
    emitter.on('error', onerror)
    emitter.on('end', cleanup)
    emitter.on('close', cleanup)

    // If the `end` option is not supplied, `dest.end()` will be called when the
    // `end` or `close` events are received.
    if (!dest._isStdio && (!options || options.end !== false)) {
      emitter.on('end', onend)
    }

    dest.on('error', onerror)
    dest.on('close', cleanup)

    dest.emit('pipe', emitter)

    return dest

    // End destination.
    function onend() {
      if (dest.end) {
        dest.end()
      }
    }

    // Handle data.
    function ondata(chunk: any) {
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
    function onerror(err: Error) {
      cleanup()

      if (!emitter.listenerCount('error')) {
        throw err // Unhandled stream error in pipe.
      }
    }
  }
}
