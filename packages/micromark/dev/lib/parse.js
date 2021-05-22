/**
 * @typedef {import('../index.js').Point} Point
 * @typedef {import('../index.js').Construct} Construct
 * @typedef {import('../index.js').ConstructRecord} ConstructRecord
 * @typedef {import('../index.js').TokenizeContext} TokenizeContext
 * @typedef {import('../index.js').InitialConstruct} InitialConstruct
 * @typedef {import('../index.js').Initializer} Initializer
 */

/**
 * @typedef _ExtensionFields
 * @property {ConstructRecord} document
 * @property {ConstructRecord} contentInitial
 * @property {ConstructRecord} flowInitial
 * @property {ConstructRecord} flow
 * @property {ConstructRecord} string
 * @property {ConstructRecord} text
 * @property {{null?: string[]}} disable
 * @property {{null?: Pick<Construct, 'resolveAll'>[]}} insideSpan
 *
 * @typedef _NormalizedExtensionFields
 * @property {Record<string, Construct[]>} document
 * @property {Record<string, Construct[]>} contentInitial
 * @property {Record<string, Construct[]>} flowInitial
 * @property {Record<string, Construct[]>} flow
 * @property {Record<string, Construct[]>} string
 * @property {Record<string, Construct[]>} text
 * @property {{null: string[]}} disable
 * @property {{null: Pick<Construct, 'resolveAll'>[]}} insideSpan
 *
 * @typedef {Record<string, Record<string, unknown>> & Partial<_ExtensionFields>} Extension
 *   A syntax extension changes how markdown is tokenized.
 *   See: <https://github.com/micromark/micromark#syntaxextension>
 *
 * @typedef {Record<string, Record<string, unknown[]>> & _NormalizedExtensionFields} FullNormalizedExtension
 * @typedef {Partial<FullNormalizedExtension>} NormalizedExtension
 *
 * @callback Create
 *   Set up a tokenizer for a content type.
 * @param {Omit<Point, '_index'|'_bufferIndex'>} [from]
 * @returns {TokenizeContext}
 *
 * @typedef Options
 *   Parse options.
 * @property {Extension[]} [extensions] Array of syntax extensions
 *
 * @typedef ParseContext
 *   A context object that helps w/ parsing markdown.
 * @property {FullNormalizedExtension} constructs
 * @property {Create} content
 * @property {Create} document
 * @property {Create} flow
 * @property {Create} string
 * @property {Create} text
 * @property {string[]} defined List of defined identifiers.
 */

import {combineExtensions} from 'micromark-util-combine-extensions'
import {content} from './initialize/content.js'
import {document} from './initialize/document.js'
import {flow} from './initialize/flow.js'
import {text, string} from './initialize/text.js'
import {createTokenizer} from './create-tokenizer.js'
import * as defaultConstructs from './constructs.js'

/**
 * @param {Options} [options]
 * @returns {ParseContext}
 */
export function parse(options = {}) {
  /** @type {FullNormalizedExtension} */
  // Note: this should crash TS, but because of the recursive types, it uses
  // `any`.
  const constructs = combineExtensions(
    // @ts-expect-error Same as above.
    [defaultConstructs].concat(options.extensions || [])
  )
  /** @type {ParseContext} */
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
   * @param {InitialConstruct} initial
   */
  function create(initial) {
    return creator
    /** @type {Create} */
    function creator(from) {
      return createTokenizer(parser, initial, from)
    }
  }
}
