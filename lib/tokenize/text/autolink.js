var asciiAlpha = require('../../character/group/ascii-alpha')
var asciiAlphanumeric = require('../../character/group/ascii-alphanumeric')
var asciiControl = require('../../character/group/ascii-control')
var imfAtext = require('../../character/group/imf-atext')

exports.tokenize = tokenizeAutolink

var lineFeed = 10 // '\n'
var space = 32
var plusSign = 43 // '+'
var dash = 45 // '-'
var dot = 46 // '.'
var colon = 58 // ':'
var lessThan = 60 // '<'
var greaterThan = 62 // '>'
var atSign = 64 // '@'

function tokenizeAutolink(effects, ok, nok) {
  var typeToken
  var potentialSchemeToken
  var sizeScheme
  var sizeLabel

  effects.enter('autolink')
  effects.enter('autolinkStartMarker')
  effects.consume()
  effects.exit('autolinkStartMarker')
  typeToken = effects.enter('autolinkUri')

  return open

  function open(code) {
    if (asciiAlpha(code)) {
      potentialSchemeToken = effects.enter('autolinkUriScheme')
      sizeScheme = 1
      effects.consume()
      return schemeOrEmailAtext
    }

    if (code === dot || imfAtext(code)) {
      typeToken.type = 'autolinkEmail'
      effects.enter('autolinkEmailLocalPart')
      effects.consume()
      return emailAtext
    }

    return nok
  }

  function schemeOrEmailAtext(code) {
    if (
      code === plusSign ||
      code === dash ||
      code === dot ||
      asciiAlphanumeric(code)
    ) {
      sizeScheme++
      effects.consume()
      return schemeInsideOrEmailAtext
    }

    if (imfAtext(code)) {
      typeToken.type = 'autolinkEmail'
      potentialSchemeToken.type = 'autolinkEmailLocalPart'
      potentialSchemeToken = undefined
      sizeScheme = undefined
      effects.consume()
      return emailAtext
    }

    return nok
  }

  function schemeInsideOrEmailAtext(code) {
    if (code === colon) {
      potentialSchemeToken = undefined
      sizeScheme = undefined
      effects.exit('autolinkUriScheme')
      effects.enter('autolinkUriSeparator')
      effects.consume()
      effects.exit('autolinkUriSeparator')
      effects.enter('autolinkUriRest')
      return urlInside
    }

    if (code === atSign) {
      return emailAtext
    }

    if (
      sizeScheme !== 32 &&
      (code === plusSign ||
        code === dot ||
        code === dash ||
        asciiAlphanumeric(code))
    ) {
      sizeScheme++
      effects.consume()
      return schemeInsideOrEmailAtext
    }

    if (imfAtext(code)) {
      return emailAtext
    }

    return nok
  }

  function urlInside(code) {
    if (
      code !== code ||
      code === lineFeed ||
      code === space ||
      code === lessThan ||
      asciiControl(code)
    ) {
      return nok
    }

    if (code === greaterThan) {
      effects.exit('autolinkUriRest')
      effects.exit('autolinkUri')

      effects.enter('autolinkEndMarker')
      effects.consume()
      effects.exit('autolinkEndMarker')
      effects.exit('autolink')

      return ok
    }

    effects.consume()
    return urlInside
  }

  function emailAtext(code) {
    if (code === atSign) {
      typeToken.type = 'autolinkEmail'
      potentialSchemeToken.type = 'autolinkEmailLocalPart'
      potentialSchemeToken = undefined
      sizeScheme = undefined
      sizeLabel = 1
      effects.exit('autolinkEmailLocalPart')
      effects.enter('autolinkEmailSeparator')
      effects.consume()
      effects.exit('autolinkEmailSeparator')
      effects.enter('autolinkEmailDomain')
      return emailAtSignOrDot
    }

    if (code === dot || imfAtext(code)) {
      typeToken.type = 'autolinkEmail'
      potentialSchemeToken.type = 'autolinkEmailLocalPart'
      potentialSchemeToken = undefined
      sizeScheme = undefined
      effects.consume()
      return emailAtext
    }

    return nok
  }

  function emailAtSignOrDot(code) {
    if (asciiAlphanumeric(code) && sizeLabel !== 63) {
      sizeLabel++
      effects.consume()
      return emailLabel
    }

    return nok
  }

  function emailLabel(code) {
    if (code === dash && sizeLabel !== 63) {
      sizeLabel++
      effects.consume()
      return emailDashState
    }

    if (code === dot && sizeLabel !== 63) {
      sizeLabel++
      effects.consume()
      return emailAtSignOrDot
    }

    if (code === greaterThan) {
      effects.exit('autolinkEmailDomain')
      effects.exit('autolinkEmail')

      effects.enter('autolinkEndMarker')
      effects.consume()
      effects.exit('autolinkEndMarker')
      effects.exit('autolink')

      return ok
    }

    if (sizeLabel !== 63 && asciiAlphanumeric(code)) {
      sizeLabel++
      effects.consume()
      return emailLabel
    }

    return nok
  }

  function emailDashState(code) {
    if (code === dash && sizeLabel !== 63) {
      sizeLabel++
      effects.consume()
      return emailDashState
    }

    if (sizeLabel !== 63 && asciiAlphanumeric(code)) {
      sizeLabel++
      effects.consume()
      return emailLabel
    }

    return nok
  }
}
