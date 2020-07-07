exports.tokenize = tokenizeLabelEnd
exports.resolveTo = resolveTo
exports.resolveAll = resolveAll

var assert = require('assert')
var asciiControl = require('../../character/group/ascii-control')
var characters = require('../../util/characters')
var clone = require('../../util/clone-point')
var core = require('../../core')

var resource = {tokenize: tokenizeResource}

function resolveAll(events) {
  var index = -1
  var length = events.length
  var token

  while (++index < length) {
    token = events[index][1]

    if (
      token.type === 'potentialLabelStartImage' ||
      token.type === 'potentialLabelStartLink' ||
      token.type === 'potentialLabelEnd'
    ) {
      console.log('all:rm:', token)
      token.type = 'data'
    }
  }

  return events
}

function resolveTo(events, helpers) {
  var index = events.length - 1
  var open
  var close
  var label
  var group
  var event
  var token
  var type
  var kind
  var openIndex
  var closeIndex
  var titleIndex
  var destinationIndex
  var tokenizer
  var origin = []

  // Find an opening.
  while (index !== -1) {
    event = events[index]
    token = event[1]

    if (event[0] === 'exit' && closeIndex === undefined) {
      if (token.type === 'potentialLabelEnd') {
        closeIndex = index
      }

      if (token.type === 'resource') {
        kind = token.type
      }

      if (token.type === 'resourceTitleData') {
        titleIndex = index
      }

      if (token.type === 'resourceDestination') {
        destinationIndex = index
      }
    }

    if (
      event[0] === 'enter' &&
      (token.type === 'potentialLabelStartImage' ||
        token.type === 'potentialLabelStartLink')
    ) {
      openIndex = index
      break
    }

    index--
  }

  // Note: we will now always find open and close tokens, because we check for
  // an opening before trying to parse, and will always create a closing.
  open = events[openIndex][1]
  close = events[closeIndex][1]

  type = open.type === 'potentialLabelStartLink' ? 'link' : 'image'

  open.type = type + 'LabelStart'
  close.type = type + 'LabelEnd'

  label = {
    type: type + 'Label',
    start: clone(open.start),
    end: clone(close.end)
  }
  group = {
    type: type,
    start: clone(open.start),
    end: clone(close.end)
  }

  if (kind === 'resource') {
    // No destination: `[text]()`
    if (destinationIndex === undefined) {
      origin = events.slice(closeIndex + 1)
    } else {
      event = events[destinationIndex]
      token = event[1]
      tokenizer = core.plainText(token.start)

      origin = events
        .slice(closeIndex + 1, destinationIndex)
        .concat(event[2].sliceStream(token).concat(null).flatMap(tokenizer))

      // No or empty title: `[text](<>)`, `[text](<> "")`
      if (titleIndex === undefined) {
        origin = origin.concat(events.slice(destinationIndex))
      } else {
        event = events[titleIndex]
        token = event[1]
        tokenizer = core.plainText(token.start)
        origin = origin.concat(
          events.slice(destinationIndex, titleIndex),
          event[2].sliceStream(token).concat(null).flatMap(tokenizer),
          events.slice(titleIndex)
        )
      }
    }
  }

  var evs = [].concat(
    events.slice(0, openIndex),
    [
      ['enter', group, helpers],
      ['enter', label, helpers]
    ],
    events.slice(openIndex, closeIndex + 1),
    [['exit', label, helpers]],
    origin,
    [['exit', group, helpers]]
  )

  // // Remove earlier openings, as we can’t have links in links.
  // if (type === 'link') {
  //   console.log('todo: remove earlier openings:', events)
  //   while (index !== -1) {
  //     event = events[index]
  //     token = event[1]
  //
  //     // To do: remove `potentialLabelStartImage`?
  //     if (token.type === 'potentialLabelStartLink') {
  //       token.type = 'data'
  //     }
  //
  //     index--
  //   }
  // }

  // console.log('e:', evs)

  return evs
}

function tokenizeLabelEnd(effects, ok, nok) {
  return precededByLabelStart(this.queue) ? start : nok

  function precededByLabelStart(events) {
    var index = events.length - 1
    var event
    var token

    // Find an opening.
    while (index !== -1) {
      event = events[index]
      token = event[1]

      if (
        event[0] === 'enter' &&
        (token.type === 'potentialLabelStartImage' ||
          token.type === 'potentialLabelStartLink')
      ) {
        return true
      }

      index--
    }

    return false
  }

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.rightSquareBracket) return nok(code)

    effects.enter('potentialLabelEnd')
    effects.consume(code)
    effects.exit('potentialLabelEnd')
    return afterLabelEnd
  }

  function afterLabelEnd(code) {
    if (code === characters.leftParenthesis) {
      return effects.createConstructAttempt(resource, ok, ok)(code)
    }

    console.log('xxx: !resource:', code)
    return nok(code)
    // if (code === characters.leftSquareBracket) {
    //   return effects.createConstructAttempt(reference, ok, ok)(code)
    // }
    //
    // return ok(code)
  }
}

function tokenizeResource(effects, ok, nok) {
  var balance = 0

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.leftParenthesis) return nok(code)

    effects.enter('resource')
    effects.enter('resourceMarker')
    effects.consume(code)
    effects.exit('resourceMarker')
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
      effects.enter('resourceDestinationMarker')
      effects.consume(code)
      effects.exit('resourceDestinationMarker')
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

    effects.enter('resourceDestinationMarker')
    effects.consume(code)
    effects.exit('resourceDestinationMarker')
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
      effects.enter('resourceTitleMarker')
      effects.consume(code)
      effects.exit('resourceTitleMarker')

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

    effects.enter('resourceTitleData')
    return titleDoubleQuoted(code)
  }

  function titleDoubleQuoted(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.quotationMark) {
      effects.exit('resourceTitleData')
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

    effects.enter('resourceTitleData')
    return titleSingleQuoted(code)
  }

  function titleSingleQuoted(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.apostrophe) {
      effects.exit('resourceTitleData')
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

    effects.enter('resourceTitleData')
    return titleParenQuoted(code)
  }

  function titleParenQuoted(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    if (code === characters.rightParenthesis) {
      effects.exit('resourceTitleData')
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
    effects.enter('resourceTitleMarker')
    effects.consume(code)
    effects.exit('resourceTitleMarker')
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

    effects.enter('resourceMarker')
    effects.consume(code)
    effects.exit('resourceMarker')
    effects.exit('resource')
    return ok
  }
}
