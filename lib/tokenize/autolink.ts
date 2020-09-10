exports.tokenize = tokenizeAutolink

import assert from 'assert'
import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiAlpha'.
import asciiAlpha from '../character/ascii-alpha'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiAlphanumeric'.
import asciiAlphanumeric from '../character/ascii-alphanumeric'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiAtext'.
import asciiAtext from '../character/ascii-atext'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiControl'.
import asciiControl from '../character/ascii-control'
import constants from '../constant/constants'
import types from '../constant/types'

function tokenizeAutolink(effects: any, ok: any, nok: any) {
  var token: any
  var size: any

  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (code !== codes.lessThan) {
      return nok(code)
    }

    effects.enter(types.autolink)
    effects.enter(types.autolinkMarker)
    effects.consume(code)
    effects.exit(types.autolinkMarker)
    token = effects.enter(types.autolinkProtocol)
    return open
  }

  function open(code: any) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      size = 1
      return schemeOrEmailAtext
    }

    return asciiAtext(code) ? emailAtext(code) : nok(code)
  }

  function schemeOrEmailAtext(code: any) {
    if (
      code === codes.plusSign ||
      code === codes.dash ||
      code === codes.dot ||
      asciiAlphanumeric(code)
    ) {
      return schemeInsideOrEmailAtext(code)
    }

    return code === codes.atSign || asciiAtext(code)
      ? emailAtext(code)
      : nok(code)
  }

  function schemeInsideOrEmailAtext(code: any) {
    if (code === codes.colon) {
      effects.consume(code)
      return urlInside
    }

    if (
      size++ < constants.autolinkSchemeSizeMax &&
      (code === codes.plusSign ||
        code === codes.dot ||
        code === codes.dash ||
        asciiAlphanumeric(code))
    ) {
      effects.consume(code)
      return schemeInsideOrEmailAtext
    }

    return code === codes.atSign || asciiAtext(code)
      ? emailAtext(code)
      : nok(code)
  }

  function urlInside(code: any) {
    if (code === codes.greaterThan) {
      effects.exit(types.autolinkProtocol)
      return end(code)
    }

    if (code === codes.space || code === codes.lessThan || asciiControl(code)) {
      return nok(code)
    }

    effects.consume(code)
    return urlInside
  }

  function emailAtext(code: any) {
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

  function emailAtSignOrDot(code: any) {
    return asciiAlphanumeric(code) ? emailLabel(code) : nok(code)
  }

  function emailLabel(code: any) {
    if (code === codes.dot) {
      effects.consume(code)
      size = 0
      return emailAtSignOrDot
    }

    if (code === codes.greaterThan) {
      token.type = types.autolinkEmail
      effects.exit(types.autolinkEmail)
      return end(code)
    }

    return emailDashState(code)
  }

  function emailDashState(code: any) {
    if (size < constants.autolinkDomainSizeMax && code === codes.dash) {
      effects.consume(code)
      size++
      return emailDashState
    }

    if (size < constants.autolinkDomainSizeMax && asciiAlphanumeric(code)) {
      effects.consume(code)
      size++
      return emailLabel
    }

    return nok(code)
  }

  function end(code: any) {
    assert.equal(code, codes.greaterThan, 'expected `>`')
    effects.enter(types.autolinkMarker)
    effects.consume(code)
    effects.exit(types.autolinkMarker)
    effects.exit(types.autolink)
    return ok
  }
}
