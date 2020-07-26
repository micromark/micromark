exports.tokenize = tokenizeAutolink

var codes = require('../../character/codes')
var asciiAlpha = require('../../character/ascii-alpha')
var asciiAlphanumeric = require('../../character/ascii-alphanumeric')
var asciiControl = require('../../character/ascii-control')
var imfAtext = require('../../character/imf-atext')
var constants = require('../../constant/constants')
var types = require('../../constant/types')

function tokenizeAutolink(effects, ok, nok) {
  var typeToken
  var sizeScheme
  var sizeLabel

  return start

  function start(code) {
    /* istanbul ignore next - Hooks. */
    if (code !== codes.lessThan) {
      return nok(code)
    }

    effects.enter(types.autolink)
    effects.enter(types.autolinkMarker)
    effects.consume(code)
    effects.exit(types.autolinkMarker)
    typeToken = effects.enter(types.autolinkUri)
    return open
  }

  function open(code) {
    if (asciiAlpha(code)) {
      sizeScheme = 1
      effects.consume(code)
      return schemeOrEmailAtext
    }

    if (code === codes.dot || imfAtext(code)) {
      typeToken.type = types.autolinkEmail
      effects.consume(code)
      return emailAtext
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
      sizeScheme++
      effects.consume(code)
      return schemeInsideOrEmailAtext
    }

    if (imfAtext(code)) {
      typeToken.type = types.autolinkEmail
      effects.consume(code)
      return emailAtext
    }

    return nok(code)
  }

  function schemeInsideOrEmailAtext(code) {
    if (code === codes.colon) {
      effects.consume(code)
      return urlInside
    }

    if (code === codes.atSign) {
      return emailAtext(code)
    }

    if (
      sizeScheme !== constants.maxAutolinkSchemeSize &&
      (code === codes.plusSign ||
        code === codes.dot ||
        code === codes.dash ||
        asciiAlphanumeric(code))
    ) {
      sizeScheme++
      effects.consume(code)
      return schemeInsideOrEmailAtext
    }

    if (imfAtext(code)) {
      return emailAtext(code)
    }

    return nok(code)
  }

  function urlInside(code) {
    if (
      code === codes.eof ||
      code === codes.space ||
      code === codes.lessThan ||
      asciiControl(code) // Includes tab, line endings.
    ) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.exit(types.autolinkUri)
      effects.enter(types.autolinkMarker)
      effects.consume(code)
      effects.exit(types.autolinkMarker)
      effects.exit(types.autolink)

      return ok
    }

    effects.consume(code)
    return urlInside
  }

  function emailAtext(code) {
    if (code === codes.atSign) {
      typeToken.type = types.autolinkEmail
      sizeLabel = 0
      effects.consume(code)
      return emailAtSignOrDot
    }

    if (code === codes.dot || imfAtext(code)) {
      typeToken.type = types.autolinkEmail
      effects.consume(code)
      return emailAtext
    }

    return nok(code)
  }

  function emailAtSignOrDot(code) {
    if (
      sizeLabel !== constants.maxAutolinkDomainSize &&
      asciiAlphanumeric(code)
    ) {
      sizeLabel++
      effects.consume(code)
      return emailLabel
    }

    return nok(code)
  }

  function emailLabel(code) {
    if (sizeLabel !== constants.maxAutolinkDomainSize && code === codes.dash) {
      sizeLabel++
      effects.consume(code)
      return emailDashState
    }

    if (code === codes.dot) {
      sizeLabel = 0
      effects.consume(code)
      return emailAtSignOrDot
    }

    if (code === codes.greaterThan) {
      effects.exit(types.autolinkEmail)
      effects.enter(types.autolinkMarker)
      effects.consume(code)
      effects.exit(types.autolinkMarker)
      effects.exit(types.autolink)

      return ok
    }

    if (
      sizeLabel !== constants.maxAutolinkDomainSize &&
      asciiAlphanumeric(code)
    ) {
      sizeLabel++
      effects.consume(code)
      return emailLabel
    }

    return nok(code)
  }

  function emailDashState(code) {
    if (sizeLabel !== constants.maxAutolinkDomainSize && code === codes.dash) {
      sizeLabel++
      effects.consume(code)
      return emailDashState
    }

    if (
      sizeLabel !== constants.maxAutolinkDomainSize &&
      asciiAlphanumeric(code)
    ) {
      sizeLabel++
      effects.consume(code)
      return emailLabel
    }

    return nok(code)
  }
}
