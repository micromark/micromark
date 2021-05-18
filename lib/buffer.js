/**
 * @typedef {import('./parse.js').Options} ParseOptions
 * @typedef {import('./compile/html.js').Options} CompileOptions
 * @typedef {import('./preprocess.js').Value} Value
 * @typedef {import('./preprocess.js').Encoding} Encoding
 */

/**
 * @typedef {ParseOptions & CompileOptions} Options
 */

import {compileHtml} from './compile/html.js'
import {parse} from './parse.js'
import {postprocess} from './postprocess.js'
import {preprocess} from './preprocess.js'

/**
 * @param value Markdown to parse (`string` or `Buffer`).
 * @param [encoding] Character encoding to understand `value` as when it’s a `Buffer` (`string`, default: `'utf8'`).
 * @param [options] Configuration
 */
export const buffer =
  /**
   * @type {(
   *   ((value: Value, encoding: Encoding, options?: Options) => string) &
   *   ((value: Value, options?: Options) => string)
   * )}
   */
  (
    /**
     * @param {Value} value
     * @param {Encoding} [encoding]
     * @param {Options} [options]
     */
    function (value, encoding, options) {
      if (typeof encoding !== 'string') {
        options = encoding
        encoding = undefined
      }

      return compileHtml(options)(
        postprocess(
          parse(options).document().write(preprocess()(value, encoding, true))
        )
      )
    }
  )
