exports.tokenize = tokenizeDefinition

var asciiControl = require('../../character/group/ascii-control')
var characters = require('../../util/characters')

var title = {tokenize: tokenizeTitle}

function tokenizeDefinition(effects, ok, nok) {
  var label = false
  var balance = 0

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.leftSquareBracket) return nok(code)

    effects.enter('definition')
    effects.enter('definitionLabel')
    effects.enter('definitionLabelStart')
    effects.consume(code)
    effects.exit('definitionLabelStart')
    return labelBreak
  }

  function labelBreak(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      effects.enter('lineFeed')
      effects.consume(code)
      effects.exit('lineFeed')
      return labelBreak
    }

    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.enter('whitespace')
      effects.consume(code)
      return labelWhitespace
    }

    if (code === characters.rightSquareBracket) {
      if (label === false) {
        return nok(code)
      }

      effects.enter('definitionLabelEnd')
      effects.consume(code)
      effects.exit('definitionLabelEnd')
      effects.exit('definitionLabel')
      return labelAfter
    }

    label = true
    effects.enter('definitionLabelData')
    effects.consume(code)
    return code === characters.backslash ? labelEscape : labelData
  }

  function labelWhitespace(code) {
    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.consume(code)
      return labelWhitespace
    }

    effects.exit('whitespace')
    return labelBreak(code)
  }

  function labelData(code) {
    if (
      code === characters.eof ||
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space ||
      code === characters.rightSquareBracket
    ) {
      effects.exit('definitionLabelData')
      return labelBreak(code)
    }

    effects.consume(code)
    return code === characters.backslash ? labelEscape : labelData
  }

  function labelEscape(code) {
    if (
      code === characters.backslash ||
      code === characters.rightSquareBracket
    ) {
      effects.consume(code)
      return labelData
    }

    return labelData(code)
  }

  function labelAfter(code) {
    if (code === characters.colon) {
      effects.consume(code)
      return destinationBefore
    }

    return nok(code)
  }

  function destinationBefore(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      effects.enter('lineFeed')
      effects.consume(code)
      effects.exit('lineFeed')
      return destinationBefore
    }

    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.enter('whitespace')
      effects.consume(code)
      return destinationBeforeWhitespace
    }

    if (code === characters.lessThan) {
      effects.enter('definitionDestination')
      effects.enter('definitionDestinationQuoted')
      effects.enter('definitionDestinationMarker')
      effects.consume(code)
      effects.exit('definitionDestinationMarker')
      return destinationQuotedBefore
    }

    if (asciiControl(code)) {
      return nok(code)
    }

    effects.enter('definitionDestination')
    effects.enter('definitionDestinationUnquoted')
    effects.enter('definitionDestinationData')
    effects.consume(code)
    return code === characters.backslash
      ? destinationUnquotedEscape
      : destinationUnquoted
  }

  function destinationBeforeWhitespace(code) {
    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.consume(code)
      return destinationBeforeWhitespace
    }

    effects.exit('whitespace')
    return destinationBefore(code)
  }

  function destinationQuotedBefore(code) {
    if (
      code === characters.eof ||
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      return nok(code)
    }

    if (code === characters.greaterThan) {
      effects.enter('definitionDestinationMarker')
      effects.consume(code)
      effects.exit('definitionDestinationMarker')
      effects.exit('definitionDestinationQuoted')
      effects.exit('definitionDestination')
      return destinationAfter
    }

    effects.enter('definitionDestinationData')
    effects.consume(code)
    return code === characters.backslash
      ? destinationQuotedEscape
      : destinationQuoted
  }

  function destinationQuoted(code) {
    if (
      code === characters.eof ||
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      return nok(code)
    }

    if (code === characters.greaterThan) {
      effects.exit('definitionDestinationData')
      return destinationQuotedBefore(code)
    }

    effects.consume(code)
    return code === characters.backslash
      ? destinationQuotedEscape
      : destinationQuoted
  }

  function destinationQuotedEscape(code) {
    if (
      code === characters.lessThan ||
      code === characters.greaterThan ||
      code === characters.backslash
    ) {
      effects.consume(code)
      return destinationQuoted
    }

    return destinationQuoted(code)
  }

  function destinationUnquoted(code) {
    if (
      code === characters.eof ||
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.exit('definitionDestinationData')
      effects.exit('definitionDestinationUnquoted')
      effects.exit('definitionDestination')
      return destinationAfter(code)
    }

    if (asciiControl(code)) {
      return nok(code)
    }

    if (code === characters.leftParenthesis) {
      balance++
      effects.consume(code)
      return destinationUnquoted
    }

    if (code === characters.rightParenthesis) {
      if (balance === 0) {
        return nok(code)
      }

      balance--
      effects.consume(code)
      return destinationUnquoted
    }

    effects.consume(code)
    return code === characters.backslash
      ? destinationUnquotedEscape
      : destinationUnquoted
  }

  function destinationUnquotedEscape(code) {
    if (
      code === characters.leftParenthesis ||
      code === characters.rightParenthesis ||
      code === characters.backslash
    ) {
      effects.consume(code)
      return destinationUnquoted
    }

    return destinationUnquoted(code)
  }

  function destinationAfter() {
    return effects.createConstructAttempt(title, after, after)
  }

  function after(code) {
    if (
      code === characters.eof ||
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      return ok(code)
    }

    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.enter('whitespace')
      effects.consume(code)
      return whitespaceAfter
    }

    return nok(code)
  }

  function whitespaceAfter(code) {
    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.consume(code)
      return whitespaceAfter
    }

    effects.exit('whitespace')
    return after(code)
  }
}

function tokenizeTitle(effects, ok, nok) {
  var marker
  var tokenType

  return start

  function start(code) {
    if (
      code === characters.eof ||
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      return before(code)
    }

    return nok(code)
  }

  function before(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      effects.enter('lineFeed')
      effects.consume(code)
      effects.exit('lineFeed')
      return before
    }

    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.enter('whitespace')
      effects.consume(code)
      return whitespaceBefore
    }

    if (
      code === characters.quotationMark ||
      code === characters.apostrophe ||
      code === characters.leftParenthesis
    ) {
      marker =
        code === characters.leftParenthesis ? characters.rightParenthesis : code
      tokenType =
        code === characters.leftParenthesis
          ? 'definitionTitleDoubleQuoted'
          : code === characters.apostrophe
          ? 'definitionTitleSingleQuoted'
          : 'definitionTitleParenQuoted'

      effects.enter('definitionTitle')
      effects.enter(tokenType)
      effects.enter('definitionTitleMarker')
      effects.consume(code)
      effects.exit('definitionTitleMarker')
      return dataStart
    }

    return nok(code)
  }

  function whitespaceBefore(code) {
    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.consume(code)
      return whitespaceBefore
    }

    effects.exit('whitespace')
    return before(code)
  }

  function dataStart(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === marker) {
      effects.enter('definitionTitleMarker')
      effects.consume(code)
      effects.exit('definitionTitleMarker')
      effects.exit(tokenType)
      effects.exit('definitionTitle')
      return ok
    }

    effects.enter('definitionTitleData')
    effects.consume(code)
    return code === characters.backslash ? escape : data
  }

  function data(code) {
    if (code === characters.eof || code === marker) {
      effects.exit('definitionTitleData')
      return dataStart(code)
    }

    effects.consume(code)
    return code === characters.backslash ? escape : data
  }

  function escape(code) {
    if (
      code === marker ||
      code === characters.leftParenthesis ||
      code === characters.backslash
    ) {
      effects.consume(code)
      return data
    }

    return data(code)
  }
}
