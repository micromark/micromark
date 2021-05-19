/**
 * @typedef {import('./types.js').Parser} Parser
 * @typedef {import('./types.js').FullNormalizedExtension} FullNormalizedExtension
 * @typedef {import('./types.js').NormalizedExtension} NormalizedExtension
 * @typedef {import('./types.js').Extension} Extension
 * @typedef {import('./types.js').Initializer} Initializer
 * @typedef {import('./types.js').Initialize} Initialize
 * @typedef {import('./types.js').Create} Create
 */

/**
 * Parse options.
 *
 * @typedef Options
 * @property {Extension[]} [extensions] Array of syntax extensions
 */

import {content} from './initialize/content.js'
import {document} from './initialize/document.js'
import {flow} from './initialize/flow.js'
import {text, string} from './initialize/text.js'
import {combineExtensions} from './util/combine-extensions.js'
import {createTokenizer} from './util/create-tokenizer.js'
import * as defaultConstructs from './constructs.js'

/**
 * @param {Options} [options]
 * @returns {Parser}
 */
export function parse(options = {}) {
  /** @type {FullNormalizedExtension} */
  // @ts-expect-error `defaultConstructs` has all required fields, so
  // `constructs` will too.
  const constructs = combineExtensions(
    // @ts-expect-error Same as above.
    [defaultConstructs].concat(options.extensions || [])
  )
  /** @type {Parser} */
  const parser = {
    defined: [],
    constructs,
    content: create(content),
    document: create(document),
    flow: create(flow),
    string: create(string),
    text: create(text)
  }

  return parser

  /**
   * @param {Initializer} initialize
   */
  function create(initialize) {
    return creator
    /** @type {Create} */
    function creator(from) {
      return createTokenizer(parser, initialize, from)
    }
  }
}
