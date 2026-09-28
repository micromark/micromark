/**
 * @import {
 *   Create,
 *   FullNormalizedExtension,
 *   InitialConstruct,
 *   ParseContext,
 *   ParseOptions
 * } from 'micromark-util-types'
 */

import {combineExtensions} from 'micromark-util-combine-extensions'
import {content} from './initialize/content.js'
import {document} from './initialize/document.js'
import {flow} from './initialize/flow.js'
import {string, text} from './initialize/text.js'
import * as defaultConstructs from './constructs.js'
import {createTokenizer} from './create-tokenizer.js'

/**
 * Default constructs, combined once, as lists of entries.
 * Combining walks every hook and code with `for...in`, which is slow, so parsing
 * without extensions copies these entries instead.
 *
 * @type {Array<[string, Array<[string, Array<unknown>]>]>}
 */
const defaultEntries = Object.entries(
  combineExtensions([defaultConstructs])
).map(function (entry) {
  return [
    entry[0],
    /** @type {Array<[string, Array<unknown>]>} */ (Object.entries(entry[1]))
  ]
})

/**
 * @param {ParseOptions | null | undefined} [options]
 *   Configuration (optional).
 * @returns {ParseContext}
 *   Parser.
 */
export function parse(options) {
  const settings = options || {}
  const extensions = settings.extensions || []
  const constructs = /** @type {FullNormalizedExtension} */ (
    extensions.length > 0
      ? combineExtensions([defaultConstructs, ...extensions])
      : copyDefaults()
  )

  /** @type {ParseContext} */
  const parser = {
    constructs,
    content: create(content),
    defined: [],
    document: create(document),
    flow: create(flow),
    lazy: {},
    string: create(string),
    text: create(text)
  }

  return parser

  /**
   * @param {InitialConstruct} initial
   *   Construct to start with.
   * @returns {Create}
   *   Create a tokenizer.
   */
  function create(initial) {
    return creator
    /** @type {Create} */
    function creator(from) {
      return createTokenizer(parser, initial, from)
    }
  }
}

/**
 * Copy the combined default constructs into fresh objects and lists, as if
 * they were combined again.
 *
 * @returns {Record<string, Record<string, Array<unknown>>>}
 *   Combined default constructs.
 */
function copyDefaults() {
  /** @type {Record<string, Record<string, Array<unknown>>>} */
  const all = {}
  let index = -1

  while (++index < defaultEntries.length) {
    const entries = defaultEntries[index][1]
    /** @type {Record<string, Array<unknown>>} */
    const hook = {}
    let offset = -1

    while (++offset < entries.length) {
      hook[entries[offset][0]] = [...entries[offset][1]]
    }

    all[defaultEntries[index][0]] = hook
  }

  return all
}
