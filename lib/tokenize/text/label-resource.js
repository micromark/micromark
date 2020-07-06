exports.tokenize = tokenizeLabelResource
exports.resolveTo = resolveTo

var assert = require('assert')
var characters = require('../../util/characters')
var asciiControl = require('../../character/group/ascii-control')
var core = require('../../core')

function resolveTo(events) {
  var index = events.length - 1
  var destinationExitIndex
  var titleValueExitIndex
  var event
  var token
  var result
  var destinationEvent
  var titleValueEvent
  var tokenizer

  // Note: we will always find a link or image, because we don’t tokenize if
  // we’re not after one.
  while (index !== -1) {
    event = events[index]

    if (event[0] === 'exit') {
      token = event[1]

      if (token.type === 'link' || token.type === 'image') {
        break
      }

      if (token.type === 'resourceTitleValue') {
        titleValueExitIndex = index
      }

      if (token.type === 'resourceDestination') {
        destinationExitIndex = index
      }
    }

    index--
  }

  result = events.slice(0, index)

  if (destinationExitIndex === undefined) {
    result = result.concat(events.slice(index + 1))
  } else {
    destinationEvent = events[destinationExitIndex]
    tokenizer = core.plainText(destinationEvent[1].start)

    result = result.concat(
      events.slice(index + 1, destinationExitIndex),
      destinationEvent[2]
        .sliceStream(destinationEvent[1])
        .concat(null)
        .flatMap(tokenizer)
    )

    if (titleValueExitIndex === undefined) {
      result = result.concat(events.slice(destinationExitIndex))
    } else {
      titleValueEvent = events[titleValueExitIndex]
      tokenizer = core.plainText(titleValueEvent[1].start)
      result = result.concat(
        events.slice(destinationExitIndex, titleValueExitIndex),
        titleValueEvent[2]
          .sliceStream(titleValueEvent[1])
          .concat(null)
          .flatMap(tokenizer),
        events.slice(titleValueExitIndex)
      )
    }
  }

  return result.concat([events[index]])
}

function tokenizeLabelResource(effects, ok, nok) {
  var balance = 0

  return start

  function start(code) {
    var previous

    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.leftParenthesis) return nok(code)

    previous = effects.previousToken

    // Only parse resources when directly after a link or image.
    if (previous.type !== 'image' && previous.type !== 'link') {
      return nok(code)
    }

    effects.enter('resource')
    effects.enter('resourceStartMarker')
    effects.consume(code)
    effects.exit('resourceStartMarker')
    return informationStart
  }

  function informationStart(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.consume(code)
      return informationStart
    }

    if (code === characters.rightParenthesis) {
      return informationEnd(code)
    }

    if (code === characters.lessThan) {
      effects.enter('resourceDestinationEnclosed')
      effects.enter('resourceDestinationStartMarker')
      effects.consume(code)
      effects.exit('resourceDestinationStartMarker')
      return resourceDestinationEnclosedBefore
    }

    if (code === characters.eof || asciiControl(code)) {
      return nok(code)
    }

    effects.enter('resourceDestination')
    effects.consume(code)
    return resourceDestination
  }

  function resourceDestinationEnclosedBefore(code) {
    if (code === characters.greaterThan) {
      return resourceDestinationEnclosedAfter(code)
    }

    effects.enter('resourceDestination')
    return resourceDestinationEnclosed(code)
  }

  function resourceDestinationEnclosed(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.eof ||
      code === characters.lessThan
    ) {
      return nok(code)
    }

    if (code === characters.greaterThan) {
      effects.exit('resourceDestination')
      return resourceDestinationEnclosedAfter(code)
    }

    if (code === characters.backslash) {
      effects.consume(code)
      return resourceDestinationEnclosedCharacterEscapeOpen
    }

    effects.consume(code)
    return resourceDestinationEnclosed
  }

  function resourceDestinationEnclosedCharacterEscapeOpen(code) {
    if (
      code === characters.lessThan ||
      code === characters.greaterThan ||
      code === characters.backslash
    ) {
      effects.consume(code)
      return resourceDestinationEnclosed
    }

    return resourceDestinationEnclosed(code)
  }

  function resourceDestinationEnclosedAfter(code) {
    assert(
      code === characters.greaterThan,
      'expected only an `>` for this state'
    )

    effects.enter('resourceDestinationEndMarker')
    effects.consume(code)
    effects.exit('resourceDestinationEndMarker')
    effects.exit('resourceDestinationEnclosed')

    return informationBetween
  }

  function resourceDestination(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.exit('resourceDestination')
      return informationBetween(code)
    }

    if (code === characters.leftParenthesis) {
      balance++
      effects.consume(code)
      return resourceDestination
    }

    if (code === characters.rightParenthesis) {
      if (balance === 0) {
        effects.exit('resourceDestination')
        return informationEnd(code)
      }

      balance--
      effects.consume(code)
      return resourceDestination
    }

    if (code === characters.backslash) {
      effects.consume(code)
      return resourceDestinationCharacterEscapeOpen
    }

    if (code === characters.eof || asciiControl(code)) {
      return nok(code)
    }

    effects.consume(code)
    return resourceDestination
  }

  function resourceDestinationCharacterEscapeOpen(code) {
    if (
      code === characters.leftParenthesis ||
      code === characters.rightParenthesis ||
      code === characters.backslash
    ) {
      effects.consume(code)
      return resourceDestination
    }

    return resourceDestination(code)
  }

  function informationBetween(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.consume(code)
      return informationBetween
    }

    if (
      code === characters.quotationMark ||
      code === characters.apostrophe ||
      code === characters.leftParenthesis
    ) {
      effects.enter('resourceTitle')
      effects.enter('resourceTitleStartMarker')
      effects.consume(code)
      effects.exit('resourceTitleStartMarker')

      return code === characters.quotationMark
        ? titleDoubleQuotedBefore
        : code === characters.apostrophe
        ? titleSingleQuotedBefore
        : titleParenQuotedBefore
    }

    return informationEnd(code)
  }

  function titleDoubleQuotedBefore(code) {
    if (code === characters.quotationMark) {
      return titleEnd(code)
    }

    effects.enter('resourceTitleValue')
    return titleDoubleQuoted(code)
  }

  function titleDoubleQuoted(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.quotationMark) {
      effects.exit('resourceTitleValue')
      return titleEnd(code)
    }

    if (code === characters.backslash) {
      effects.consume(code)
      return titleDoubleQuotedCharacterEscapeOpen
    }

    effects.consume(code)
    return titleDoubleQuoted
  }

  function titleDoubleQuotedCharacterEscapeOpen(code) {
    if (code === characters.quotationMark || code === characters.backslash) {
      effects.consume(code)
      return titleDoubleQuoted
    }

    return titleDoubleQuoted(code)
  }

  function titleSingleQuotedBefore(code) {
    if (code === characters.apostrophe) {
      return titleEnd(code)
    }

    effects.enter('resourceTitleValue')
    return titleSingleQuoted(code)
  }

  function titleSingleQuoted(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.apostrophe) {
      effects.exit('resourceTitleValue')
      return titleEnd(code)
    }

    if (code === characters.backslash) {
      effects.consume(code)
      return titleSingleQuotedCharacterEscapeOpen
    }

    effects.consume(code)
    return titleSingleQuoted
  }

  function titleSingleQuotedCharacterEscapeOpen(code) {
    if (code === characters.apostrophe || code === characters.backslash) {
      effects.consume(code)
      return titleSingleQuoted
    }

    return titleSingleQuoted(code)
  }

  function titleParenQuotedBefore(code) {
    if (code === characters.rightParenthesis) {
      return titleEnd(code)
    }

    effects.enter('resourceTitleValue')
    return titleParenQuoted(code)
  }

  function titleParenQuoted(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.rightParenthesis) {
      effects.exit('resourceTitleValue')
      return titleEnd(code)
    }

    if (code === characters.backslash) {
      effects.consume(code)
      return titleParenQuotedCharacterEscapeOpen
    }

    effects.consume(code)
    return titleParenQuoted
  }

  function titleParenQuotedCharacterEscapeOpen(code) {
    if (code === characters.rightParenthesis || code === characters.backslash) {
      effects.consume(code)
      return titleParenQuoted
    }

    return titleParenQuoted(code)
  }

  // Only used for valid endings.
  function titleEnd(code) {
    effects.enter('resourceTitleEndMarker')
    effects.consume(code)
    effects.exit('resourceTitleEndMarker')
    effects.exit('resourceTitle')
    return titleAfter
  }

  function titleAfter(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.consume(code)
      return titleAfter
    }

    return informationEnd(code)
  }

  function informationEnd(code) {
    if (code !== characters.rightParenthesis) {
      return nok(code)
    }

    effects.enter('resourceEndMarker')
    effects.consume(code)
    effects.exit('resourceEndMarker')
    effects.exit('resource')
    return ok
  }
}
