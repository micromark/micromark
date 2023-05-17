/**
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 */

import {
  asciiAlpha,
  asciiAlphanumeric,
  asciiAtext,
  asciiControl
} from 'micromark-util-character'
import {codes} from 'micromark-util-symbol/codes.js'
import {constants} from 'micromark-util-symbol/constants.js'
import {types} from 'micromark-util-symbol/types.js'
import {ok as assert} from 'uvu/assert'

/** @type {Construct} */
export const autolink = {name: 'autolink', tokenize: tokenizeAutolink}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeAutolink(effects, ok, nok) {
  let size = 1

  return start

  /**
   * Start of an autolink.
   *
   * ```markdown
   * > | a<https://example.com>b
   *      ^
   * > | a<user@example.com>b
   *      ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    assert(code === codes.lessThan, 'expected `<`')
    effects.enter(types.autolink)
    effects.enter(types.autolinkMarker)
    effects.consume(code)
    effects.exit(types.autolinkMarker)
    effects.enter(types.autolinkProtocol)
    return open
  }

  /**
   * After `<`, before the protocol.
   *
   * ```markdown
   * > | a<https://example.com>b
   *       ^
   * > | a<user@example.com>b
   *       ^
   * ```
   *
   * @type {State}
   */
  function open(code) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      return schemeOrEmailAtext
    }

    return emailAtext(code)
  }

  /**
   * After the first byte of the protocol or email name.
   *
   * ```markdown
   * > | a<https://example.com>b
   *        ^
   * > | a<user@example.com>b
   *        ^
   * ```
   *
   * @type {State}
   */
  function schemeOrEmailAtext(code) {
    return code === codes.plusSign ||
      code === codes.dash ||
      code === codes.dot ||
      asciiAlphanumeric(code)
      ? schemeInsideOrEmailAtext(code)
      : emailAtext(code)
  }

  /**
   * Inside an ambiguous protocol or email name.
   *
   * ```markdown
   * > | a<https://example.com>b
   *        ^
   * > | a<user@example.com>b
   *        ^
   * ```
   *
   * @type {State}
   */
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

  /**
   * Inside a URL, after the protocol.
   *
   * ```markdown
   * > | a<https://example.com>b
   *             ^
   * ```
   *
   * @type {State}
   */
  function urlInside(code) {
    if (code === codes.greaterThan) {
      effects.exit(types.autolinkProtocol)
      return end(code)
    }

    // ASCII control or space.
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

  /**
   * Inside email atext.
   *
   * ```markdown
   * > | a<user.name@example.com>b
   *              ^
   * ```
   *
   * @type {State}
   */
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

  /**
   * After an at-sign or a dot in the label.
   *
   * ```markdown
   * > | a<user.name@example.com>b
   *                 ^       ^
   * ```
   *
   * @type {State}
   */
  function emailAtSignOrDot(code) {
    return asciiAlphanumeric(code) ? emailLabel(code) : nok(code)
  }

  /**
   * In the label, where `.` and `>` are allowed.
   *
   * ```markdown
   * > | a<user.name@example.com>b
   *                   ^
   * ```
   *
   * @type {State}
   */
  function emailLabel(code) {
    if (code === codes.dot) {
      effects.consume(code)
      size = 0
      return emailAtSignOrDot
    }

    if (code === codes.greaterThan) {
      // Exit, then change the token type.
      effects.exit(types.autolinkProtocol).type = types.autolinkEmail
      return end(code)
    }

    return emailValue(code)
  }

  /**
   * In the label, where `.` and `>` are *not* allowed.
   *
   * Though, this is also used in `email_label` to parse other values.
   *
   * ```markdown
   * > | a<user.name@ex-ample.com>b
   *                    ^
   * ```
   *
   * @type {State}
   */
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

  /**
   * At the `>`.
   *
   * ```markdown
   * > | a<https://example.com>b
   *                          ^
   * > | a<user@example.com>b
   *                       ^
   * ```
   *
   * @type {State}
   */
  function end(code) {
    assert(code === codes.greaterThan, 'expected `>`')
    effects.enter(types.autolinkMarker)
    effects.consume(code)
    effects.exit(types.autolinkMarker)
    effects.exit(types.autolink)
    return ok
  }
}
