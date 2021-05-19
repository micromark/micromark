/**
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Tokenize} Tokenize
 * @typedef {import('../types.js').State} State
 */

import assert from 'assert'
import {asciiAlpha} from '../character/ascii-alpha.js'
import {asciiAlphanumeric} from '../character/ascii-alphanumeric.js'
import {asciiAtext} from '../character/ascii-atext.js'
import {asciiControl} from '../character/ascii-control.js'
import {codes} from '../character/codes.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'

/** @type {Construct} */
export const autolink = {name: 'autolink', tokenize: tokenizeAutolink}

/** @type {Tokenize} */
function tokenizeAutolink(effects, ok, nok) {
  let size = 1

  return start

  /** @type {State} */
  function start(code) {
    assert(code === codes.lessThan, 'expected `<`')
    effects.enter(types.autolink)
    effects.enter(types.autolinkMarker)
    effects.consume(code)
    effects.exit(types.autolinkMarker)
    effects.enter(types.autolinkProtocol)
    return open
  }

  /** @type {State} */
  function open(code) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      return schemeOrEmailAtext
    }

    return asciiAtext(code) ? emailAtext(code) : nok(code)
  }

  /** @type {State} */
  function schemeOrEmailAtext(code) {
    return code === codes.plusSign ||
      code === codes.dash ||
      code === codes.dot ||
      asciiAlphanumeric(code)
      ? schemeInsideOrEmailAtext(code)
      : emailAtext(code)
  }

  /** @type {State} */
  function schemeInsideOrEmailAtext(code) {
    if (code === codes.colon) {
      effects.consume(code)
      return urlInside
    }

    if (
      (code === codes.plusSign ||
        code === codes.dash ||
        code === codes.dot ||
        asciiAlphanumeric(code)) &&
      size++ < constants.autolinkSchemeSizeMax
    ) {
      effects.consume(code)
      return schemeInsideOrEmailAtext
    }

    return emailAtext(code)
  }

  /** @type {State} */
  function urlInside(code) {
    if (code === codes.greaterThan) {
      effects.exit(types.autolinkProtocol)
      return end(code)
    }

    if (
      code === codes.eof ||
      code === codes.space ||
      code === codes.lessThan ||
      asciiControl(code)
    ) {
      return nok(code)
    }

    effects.consume(code)
    return urlInside
  }

  /** @type {State} */
  function emailAtext(code) {
    if (code === codes.atSign) {
      effects.consume(code)
      size = 0
      return emailAtSignOrDot
    }

    if (asciiAtext(code)) {
      effects.consume(code)
      return emailAtext
    }

    return nok(code)
  }

  /** @type {State} */
  function emailAtSignOrDot(code) {
    return asciiAlphanumeric(code) ? emailLabel(code) : nok(code)
  }

  /** @type {State} */
  function emailLabel(code) {
    if (code === codes.dot) {
      effects.consume(code)
      size = 0
      return emailAtSignOrDot
    }

    if (code === codes.greaterThan) {
      // Exit, then change the type.
      effects.exit(types.autolinkProtocol).type = types.autolinkEmail
      return end(code)
    }

    return emailValue(code)
  }

  /** @type {State} */
  function emailValue(code) {
    if (
      (code === codes.dash || asciiAlphanumeric(code)) &&
      size++ < constants.autolinkDomainSizeMax
    ) {
      effects.consume(code)
      return code === codes.dash ? emailValue : emailLabel
    }

    return nok(code)
  }

  /** @type {State} */
  function end(code) {
    assert.strictEqual(code, codes.greaterThan, 'expected `>`')
    effects.enter(types.autolinkMarker)
    effects.consume(code)
    effects.exit(types.autolinkMarker)
    effects.exit(types.autolink)
    return ok
  }
}
