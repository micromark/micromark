exports.tokenize = tokenizeAutolink

var codes = require('../../character/codes')
var asciiAlpha = require('../../character/ascii-alpha')
var asciiAlphanumeric = require('../../character/ascii-alphanumeric')
var asciiControl = require('../../character/ascii-control')
var imfAtext = require('../../character/imf-atext')

var maxDomainSize = 63 // 63 characters is fine, 64 is too many.

function tokenizeAutolink(effects, ok, nok) {
  var typeToken
  var potentialSchemeToken
  var sizeScheme
  var sizeLabel

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.lessThan) return nok(code)

    effects.enter('autolink')
    effects.enter('autolinkStartMarker')
    effects.consume(code)
    effects.exit('autolinkStartMarker')
    typeToken = effects.enter('autolinkUri')
    return open
  }

  function open(code) {
    if (asciiAlpha(code)) {
      potentialSchemeToken = effects.enter('autolinkUriScheme')
      sizeScheme = 1
      effects.consume(code)
      return schemeOrEmailAtext
    }

    if (code === codes.dot || imfAtext(code)) {
      typeToken.type = 'autolinkEmail'
      effects.enter('autolinkEmailLocalPart')
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
      typeToken.type = 'autolinkEmail'
      potentialSchemeToken.type = 'autolinkEmailLocalPart'
      potentialSchemeToken = undefined
      sizeScheme = undefined
      effects.consume(code)
      return emailAtext
    }

    return nok(code)
  }

  function schemeInsideOrEmailAtext(code) {
    if (code === codes.colon) {
      potentialSchemeToken = undefined
      sizeScheme = undefined
      effects.exit('autolinkUriScheme')
      effects.enter('autolinkUriSeparator')
      effects.consume(code)
      effects.exit('autolinkUriSeparator')
      effects.enter('autolinkUriRest')
      return urlInside
    }

    if (code === codes.atSign) {
      return emailAtext
    }

    if (
      sizeScheme !== 32 &&
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
      return emailAtext
    }

    return nok(code)
  }

  function urlInside(code) {
    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf ||
      code === codes.space ||
      code === codes.lessThan ||
      asciiControl(code) // Includes tab.
    ) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.exit('autolinkUriRest')
      effects.exit('autolinkUri')

      effects.enter('autolinkEndMarker')
      effects.consume(code)
      effects.exit('autolinkEndMarker')
      effects.exit('autolink')

      return ok(code)
    }

    effects.consume(code)
    return urlInside
  }

  function emailAtext(code) {
    if (code === codes.atSign) {
      typeToken.type = 'autolinkEmail'
      if (potentialSchemeToken) {
        potentialSchemeToken.type = 'autolinkEmailLocalPart'
        potentialSchemeToken = undefined
        sizeScheme = undefined
      }

      sizeLabel = 0
      effects.exit('autolinkEmailLocalPart')
      effects.enter('autolinkEmailSeparator')
      effects.consume(code)
      effects.exit('autolinkEmailSeparator')
      effects.enter('autolinkEmailDomain')
      return emailAtSignOrDot
    }

    if (code === codes.dot || imfAtext(code)) {
      typeToken.type = 'autolinkEmail'
      if (potentialSchemeToken) {
        potentialSchemeToken.type = 'autolinkEmailLocalPart'
        potentialSchemeToken = undefined
        sizeScheme = undefined
      }

      effects.consume(code)
      return emailAtext
    }

    return nok(code)
  }

  function emailAtSignOrDot(code) {
    if (asciiAlphanumeric(code) && sizeLabel !== maxDomainSize) {
      sizeLabel++
      effects.consume(code)
      return emailLabel
    }

    return nok(code)
  }

  function emailLabel(code) {
    if (code === codes.dash && sizeLabel !== maxDomainSize) {
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
      effects.exit('autolinkEmailDomain')
      effects.exit('autolinkEmail')

      effects.enter('autolinkEndMarker')
      effects.consume(code)
      effects.exit('autolinkEndMarker')
      effects.exit('autolink')

      return ok(code)
    }

    if (sizeLabel !== maxDomainSize && asciiAlphanumeric(code)) {
      sizeLabel++
      effects.consume(code)
      return emailLabel
    }

    return nok(code)
  }

  function emailDashState(code) {
    if (code === codes.dash && sizeLabel !== maxDomainSize) {
      sizeLabel++
      effects.consume(code)
      return emailDashState
    }

    if (sizeLabel !== maxDomainSize && asciiAlphanumeric(code)) {
      sizeLabel++
      effects.consume(code)
      return emailLabel
    }

    return nok(code)
  }
}
