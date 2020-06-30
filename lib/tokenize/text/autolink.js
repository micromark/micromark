exports.tokenize = tokenizeAutolink

var characters = require('../../util/characters')
var asciiAlpha = require('../../character/group/ascii-alpha')
var asciiAlphanumeric = require('../../character/group/ascii-alphanumeric')
var asciiControl = require('../../character/group/ascii-control')
var imfAtext = require('../../character/group/imf-atext')

var maxDomainSize = 63 // 63 characters is fine, 64 is too many.

function tokenizeAutolink(effects, ok, nok) {
  var typeToken
  var potentialSchemeToken
  var sizeScheme
  var sizeLabel

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.lessThan) return nok(code)

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

    if (code === characters.dot || imfAtext(code)) {
      typeToken.type = 'autolinkEmail'
      effects.enter('autolinkEmailLocalPart')
      effects.consume(code)
      return emailAtext
    }

    return nok(code)
  }

  function schemeOrEmailAtext(code) {
    if (
      code === characters.plusSign ||
      code === characters.dash ||
      code === characters.dot ||
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
    if (code === characters.colon) {
      potentialSchemeToken = undefined
      sizeScheme = undefined
      effects.exit('autolinkUriScheme')
      effects.enter('autolinkUriSeparator')
      effects.consume(code)
      effects.exit('autolinkUriSeparator')
      effects.enter('autolinkUriRest')
      return urlInside
    }

    if (code === characters.atSign) {
      return emailAtext
    }

    if (
      sizeScheme !== 32 &&
      (code === characters.plusSign ||
        code === characters.dot ||
        code === characters.dash ||
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
      code === characters.eof ||
      code === characters.lineFeed ||
      code === characters.space ||
      code === characters.lessThan ||
      asciiControl(code) // Includes tab.
    ) {
      return nok(code)
    }

    if (code === characters.greaterThan) {
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
    if (code === characters.atSign) {
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

    if (code === characters.dot || imfAtext(code)) {
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
    if (code === characters.dash && sizeLabel !== maxDomainSize) {
      sizeLabel++
      effects.consume(code)
      return emailDashState
    }

    if (code === characters.dot) {
      sizeLabel = 0
      effects.consume(code)
      return emailAtSignOrDot
    }

    if (code === characters.greaterThan) {
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
    if (code === characters.dash && sizeLabel !== maxDomainSize) {
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
