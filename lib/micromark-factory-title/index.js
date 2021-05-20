/**
 * @typedef {import('../micromark/index.js').Effects} Effects
 * @typedef {import('../micromark/index.js').State} State
 * @typedef {import('../micromark/index.js').Code} Code
 */

import assert from 'assert'
import {codes} from '../micromark-core-symbol/codes.js'
import {markdownLineEnding} from '../micromark-core-character/index.js'
import {constants} from '../micromark-core-symbol/constants.js'
import {types} from '../micromark-core-symbol/types.js'
import {factorySpace} from '../micromark-factory-space/index.js'

/**
 * @param {Effects} effects
 * @param {State} ok
 * @param {State} nok
 * @param {string} type
 * @param {string} markerType
 * @param {string} stringType
 * @returns {State}
 */
// eslint-disable-next-line max-params
export function factoryTitle(effects, ok, nok, type, markerType, stringType) {
  /** @type {NonNullable<Code>} */
  let marker

  return start

  /** @type {State} */
  function start(code) {
    assert(
      code === codes.quotationMark ||
        code === codes.apostrophe ||
        code === codes.leftParenthesis,
      'expected `"`, `\'`, or `(`'
    )
    effects.enter(type)
    effects.enter(markerType)
    effects.consume(code)
    effects.exit(markerType)
    marker = code === codes.leftParenthesis ? codes.rightParenthesis : code
    return atFirstTitleBreak
  }

  /** @type {State} */
  function atFirstTitleBreak(code) {
    if (code === marker) {
      effects.enter(markerType)
      effects.consume(code)
      effects.exit(markerType)
      effects.exit(type)
      return ok
    }

    effects.enter(stringType)
    return atTitleBreak(code)
  }

  /** @type {State} */
  function atTitleBreak(code) {
    if (code === marker) {
      effects.exit(stringType)
      return atFirstTitleBreak(marker)
    }

    if (code === codes.eof) {
      return nok(code)
    }

    // Note: blank lines can’t exist in content.
    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return factorySpace(effects, atTitleBreak, types.linePrefix)
    }

    effects.enter(types.chunkString, {contentType: constants.contentTypeString})
    return title(code)
  }

  /** @type {State} */
  function title(code) {
    if (code === marker || code === codes.eof || markdownLineEnding(code)) {
      effects.exit(types.chunkString)
      return atTitleBreak(code)
    }

    effects.consume(code)
    return code === codes.backslash ? titleEscape : title
  }

  /** @type {State} */
  function titleEscape(code) {
    if (code === marker || code === codes.backslash) {
      effects.consume(code)
      return title
    }

    return title(code)
  }
}
