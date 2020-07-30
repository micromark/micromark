exports.tokenize = tokenizeAutolink

var assert = require('assert')
var codes = require('../character/codes')
var asciiAlpha = require('../character/ascii-alpha')
var asciiAlphanumeric = require('../character/ascii-alphanumeric')
var asciiControl = require('../character/ascii-control')
var imfAtext = require('../character/ascii-imf-atext')
var constants = require('../constant/constants')
var types = require('../constant/types')

function tokenizeAutolink(effects, ok, nok) {
  var token
  var size

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.lessThan) {
      return nok(code)
    }

    effects.enter(types.autolink)
    effects.enter(types.autolinkMarker)
    effects.consume(code)
    effects.exit(types.autolinkMarker)
    token = effects.enter(types.autolinkUri)
    return open
  }

  function open(code) {
    if (asciiAlpha(code)) {
      effects.consume(code)
      size = 1
      return schemeOrEmailAtext
    }

    if (code === codes.dot || imfAtext(code)) {
      return emailAtext(code)
    }

    return nok(code)
  }

  function schemeOrEmailAtext(code) {
    if (
      code === codes.plusSign ||
      code === codes.dash ||
      code === codes.dot ||
      asciiAlphanumeric(code)
    ) {
      return schemeInsideOrEmailAtext(code)
    }

    if (imfAtext(code)) {
      return emailAtext(code)
    }

    return nok(code)
  }

  function schemeInsideOrEmailAtext(code) {
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

    if (imfAtext(code) || code === codes.atSign) {
      return emailAtext(code)
    }

    return nok(code)
  }

  function urlInside(code) {
    if (
      code === codes.space ||
      code === codes.lessThan ||
      asciiControl(code) // Includes tab, line endings.
    ) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.exit(types.autolinkUri)
      return end(code)
    }

    effects.consume(code)
    return urlInside
  }

  function emailAtext(code) {
    if (code === codes.atSign) {
      effects.consume(code)
      size = 0
      return emailAtSignOrDot
    }

    if (code === codes.dot || imfAtext(code)) {
      effects.consume(code)
      return emailAtext
    }

    return nok(code)
  }

  function emailAtSignOrDot(code) {
    return asciiAlphanumeric(code) ? emailLabel(code) : nok(code)
  }

  function emailLabel(code) {
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

  function emailDashState(code) {
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

  function end(code) {
    assert(code === codes.greaterThan, 'expected `>`')
    effects.enter(types.autolinkMarker)
    effects.consume(code)
    effects.exit(types.autolinkMarker)
    effects.exit(types.autolink)
    return ok
  }
}