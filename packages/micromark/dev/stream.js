/**
 * @typedef {import('micromark-util-types').Options} Options
 * @typedef {import('micromark-util-types').Value} Value
 * @typedef {import('micromark-util-types').Encoding} Encoding
 */

/**
 * @callback Callback
 * @param {Error | undefined} [Error]
 * @returns {void}
 *
 * @typedef {Omit<NodeJS.ReadableStream & NodeJS.WritableStream, 'isPaused' | 'pause' | 'read' | 'resume' | 'setEncoding' | 'unpipe' | 'unshift' | 'wrap'>} MinimalDuplex
 */

import {EventEmitter} from 'events'
import {compile} from './lib/compile.js'
import {parse} from './lib/parse.js'
import {postprocess} from './lib/postprocess.js'
import {preprocess} from './lib/preprocess.js'

/**
 * @param {Options | null | undefined} [options]
 * @returns {MinimalDuplex}
 */
export function stream(options) {
  const prep = preprocess()
  const tokenize = parse(options).document().write
  const comp = compile(options)
  /** @type {boolean} */
  let ended

  /**
   * Write a chunk into memory.
   *
   * @param chunk
   * @param encoding
   * @param callback
   */
  const write =
    /**
     * @type {(
     *   ((value?: Value | null | undefined, encoding?: Encoding | null | undefined, callback?: Callback | null | undefined) => boolean) &
     *   ((value?: Value | null | undefined, callback?: Callback | null | undefined) => boolean)
     * )}
     */
    (
      /**
       * @param {Value | null | undefined} [chunk]
       * @param {Encoding | null | undefined} [encoding]
       * @param {Callback | null | undefined} [callback]
       */
      function (chunk, encoding, callback) {
        if (typeof encoding === 'function') {
          callback = encoding
          encoding = undefined
        }

        if (ended) {
          throw new Error('Did not expect `write` after `end`')
        }

        tokenize(prep(chunk || '', encoding))

        if (callback) {
          callback()
        }

        // Signal successful write.
        return true
      }
    )

  /**
   * End the writing.
   * Passes all arguments to a final `write`.
   *
   * @param chunk
   * @param encoding
   * @param callback
   */
  const end =
    /**
     * @type {(
     *   ((value?: Value | null | undefined, encoding?: Encoding | null | undefined, callback?: Callback | null | undefined) => boolean) &
     *   ((value?: Value | null | undefined, callback?: Callback | null | undefined) => boolean)
     * )}
     */
    (
      /**
       * @param {Value | null | undefined} [chunk]
       * @param {Encoding | null | undefined} [encoding]
       * @param {Callback | null | undefined} [callback]
       */
      function (chunk, encoding, callback) {
        if (typeof chunk === 'function') {
          encoding = chunk
          chunk = undefined
        }

        write(chunk, encoding, callback)

        emitter.emit(
          'data',
          comp(postprocess(tokenize(prep('', encoding, true))))
        )

        emitter.emit('end')
        ended = true
        return true
      }
    )

  /** @type {MinimalDuplex} */
  // @ts-expect-error `addListener` is fine.
  const emitter = Object.assign(new EventEmitter(), {
    writable: true,
    readable: true,
    write,
    end,
    pipe
  })

  return emitter

  /**
   * Pipe the processor into a writable stream.
   * Basically `Stream#pipe`, but inlined and simplified to keep the bundled
   * size down.
   * See: <https://github.com/nodejs/node/blob/43a5170/lib/internal/streams/legacy.js#L13>.
   *
   * @template {NodeJS.WritableStream} Stream
   * @param {Stream} dest
   * @param {{end?: boolean}} [options]
   * @returns {Stream}
   */
  function pipe(dest, options) {
    emitter.on('data', ondata)
    emitter.on('error', onerror)
    emitter.on('end', cleanup)
    emitter.on('close', cleanup)

    // If the `end` option is not supplied, `dest.end()` will be
    // called when the `end` or `close` events are received.
    // @ts-expect-error `_isStdio` is available on `std{err,out}`
    if (!dest._isStdio && (!options || options.end !== false)) {
      emitter.on('end', onend)
    }

    dest.on('error', onerror)
    dest.on('close', cleanup)

    dest.emit('pipe', emitter)

    return dest

    /**
     * End destination.
     *
     * @returns {void}
     */
    function onend() {
      if (dest.end) {
        dest.end()
      }
    }

    /**
     * Handle data.
     *
     * @param {string} chunk
     * @returns {void}
     */
    function ondata(chunk) {
      if (dest.writable) {
        dest.write(chunk)
      }
    }

    /**
     * Clean listeners.
     *
     * @returns {void}
     */
    function cleanup() {
      emitter.removeListener('data', ondata)
      emitter.removeListener('end', onend)
      emitter.removeListener('error', onerror)
      emitter.removeListener('end', cleanup)
      emitter.removeListener('close', cleanup)

      dest.removeListener('error', onerror)
      dest.removeListener('close', cleanup)
    }

    /**
     * Close dangling pipes and handle unheard errors.
     *
     * @param {Error?} [error]
     * @returns {void}
     */
    function onerror(error) {
      cleanup()

      if (!emitter.listenerCount('error')) {
        throw error // Unhandled stream error in pipe.
      }
    }
  }
}
