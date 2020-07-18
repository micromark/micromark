exports.tokenize = tokenizeLabelEnd
exports.resolveTo = resolveTo
exports.resolveAll = resolveAll

var assert = require('assert')
var asciiControl = require('../../character/ascii-control')
var codes = require('../../character/codes')
var clone = require('../../util/clone-point')
var core = require('../../core')
var resolveAllEmphasis = require('./emphasis').resolveAll

var resource = {tokenize: tokenizeResource}
var reference = {tokenize: tokenizeReference}

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
      token.type = 'data'
    }
  }

  return events
}

/* eslint-disable-next-line complexity */
function resolveTo(events, helpers) {
  var index = events.length - 1
  var kind = 'reference'
  var open
  var close
  var end
  var group
  var label
  var data
  var event
  var token
  var type
  var openIndex
  var closeIndex
  var titleIndex
  var destinationIndex
  var referenceIndex
  var referenceDataIndex
  var tokenizer
  var origin

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

    if (event[0] === 'enter') {
      // Find where the link or image starts.
      if (openIndex === undefined) {
        if (token.type === 'reference') {
          referenceIndex = index
        }

        if (token.type === 'referenceData') {
          referenceDataIndex = index
        }

        if (
          (token.type === 'potentialLabelStartImage' ||
            token.type === 'potentialLabelStartLink') &&
          token.active === true
        ) {
          openIndex = index
          type = token.type === 'potentialLabelStartLink' ? 'link' : 'image'
        }
      }
      // More openings before our start.
      else {
        // Mark other link openings as data, as we can’t have links in links.
        if (type === 'link' && token.type === 'potentialLabelStartLink') {
          token.active = false
        }
      }
    }

    index--
  }

  // Note: we will now always find open and close tokens, because we check for
  // an opening before trying to parse, and will always create a closing.
  open = events[openIndex][1]
  close = events[closeIndex][1]

  open.type = type + 'LabelStart'
  close.type = type + 'LabelEnd'

  label = {type: 'label', start: clone(open.start), end: clone(close.end)}
  data = {type: 'labelData', start: clone(open.end), end: clone(close.start)}

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
  // Reference.
  else {
    // Shortcut (`[text]`).
    if (referenceIndex === undefined) {
      origin = []
    }
    // Collaped (`[text][]`).
    else if (referenceDataIndex === undefined) {
      origin = events.slice(referenceIndex)
    }
    // Full (`[text][label]`).
    else {
      event = events[referenceDataIndex]
      token = event[1]
      tokenizer = core.plainText(token.start)
      origin = [].concat(
        events.slice(referenceIndex, referenceDataIndex + 1),
        event[2].sliceStream(token).concat(null).flatMap(tokenizer),
        events.slice(referenceDataIndex + 1)
      )
    }
  }

  end = events[events.length - 1][1]
  group = {type: type, start: clone(open.start), end: clone(end.end)}

  return [].concat(
    events.slice(0, openIndex),
    [
      ['enter', group, helpers],
      ['enter', label, helpers],
      events[openIndex],
      ['enter', data, helpers]
    ],
    resolveAllEmphasis(events.slice(openIndex + 1, closeIndex)),
    [['exit', data, helpers], events[closeIndex], ['exit', label, helpers]],
    origin,
    [['exit', group, helpers]]
  )
}

function tokenizeLabelEnd(effects, ok, nok) {
  var preceding = getStart(this.queue)

  return preceding ? start : nok

  function getStart(events) {
    var index = events.length - 1
    var token

    // Find an opening.
    while (index !== -1) {
      token = events[index][1]

      if (
        token.type === 'potentialLabelStartImage' ||
        token.type === 'potentialLabelStartLink'
      ) {
        return token
      }

      index--
    }

    return undefined
  }

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.rightSquareBracket) return nok(code)

    effects.enter('potentialLabelEnd')
    effects.consume(code)
    effects.exit('potentialLabelEnd')

    // It’s a balanced bracket, hackily mark the preceding as `data`.
    if (preceding.active === false) {
      preceding.type = 'data'
      return nok
    }

    return afterLabelEnd
  }

  function afterLabelEnd(code) {
    // Resource: `[asd](fgh)`.
    if (code === codes.leftParenthesis) {
      return effects.createConstructAttempt(resource, ok, ok)(code)
    }

    // Full (`[asd][fgh]`) or collapsed (`[asd][]`) reference.
    // Shortcut reference: `[asd]`.
    if (code === codes.leftSquareBracket) {
      return effects.createConstructAttempt(reference, ok, ok)(code)
    }

    // Shortcut reference: `[asd]`.
    return ok(code)
  }
}

function tokenizeResource(effects, ok, nok) {
  var balance = 0

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.leftParenthesis) return nok(code)

    effects.enter('resource')
    effects.enter('resourceMarker')
    effects.consume(code)
    effects.exit('resourceMarker')
    return informationStart
  }

  function informationStart(code) {
    if (
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf ||
      code === codes.ht ||
      code === codes.vs ||
      code === codes.space
    ) {
      effects.consume(code)
      return informationStart
    }

    if (code === codes.rightParenthesis) {
      return informationEnd(code)
    }

    if (code === codes.lessThan) {
      effects.enter('resourceDestinationEnclosed')
      effects.enter('resourceDestinationMarker')
      effects.consume(code)
      effects.exit('resourceDestinationMarker')
      return resourceDestinationEnclosedBefore
    }

    if (code === codes.eof || asciiControl(code)) {
      return nok(code)
    }

    effects.enter('resourceDestination')
    return resourceDestination(code)
  }

  function resourceDestinationEnclosedBefore(code) {
    if (code === codes.greaterThan) {
      return resourceDestinationEnclosedAfter(code)
    }

    effects.enter('resourceDestination')
    return resourceDestinationEnclosed(code)
  }

  function resourceDestinationEnclosed(code) {
    if (
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf ||
      code === codes.eof ||
      code === codes.lessThan
    ) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.exit('resourceDestination')
      return resourceDestinationEnclosedAfter(code)
    }

    effects.consume(code)
    return code === codes.backslash
      ? resourceDestinationEnclosedEscape
      : resourceDestinationEnclosed
  }

  function resourceDestinationEnclosedEscape(code) {
    if (
      code === codes.lessThan ||
      code === codes.greaterThan ||
      code === codes.backslash
    ) {
      effects.consume(code)
      return resourceDestinationEnclosed
    }

    return resourceDestinationEnclosed(code)
  }

  function resourceDestinationEnclosedAfter(code) {
    assert(code === codes.greaterThan, 'expected only an `>` for this state')

    effects.enter('resourceDestinationMarker')
    effects.consume(code)
    effects.exit('resourceDestinationMarker')
    effects.exit('resourceDestinationEnclosed')

    return informationBetween
  }

  function resourceDestination(code) {
    if (
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf ||
      code === codes.ht ||
      code === codes.vs ||
      code === codes.space
    ) {
      effects.exit('resourceDestination')
      return informationBetween(code)
    }

    if (code === codes.leftParenthesis) {
      balance++
      effects.consume(code)
      return resourceDestination
    }

    if (code === codes.rightParenthesis) {
      if (balance === 0) {
        effects.exit('resourceDestination')
        return informationEnd(code)
      }

      balance--
      effects.consume(code)
      return resourceDestination
    }

    if (code === codes.eof || asciiControl(code)) {
      return nok(code)
    }

    effects.consume(code)
    return code === codes.backslash
      ? resourceDestinationEscape
      : resourceDestination
  }

  function resourceDestinationEscape(code) {
    if (
      code === codes.leftParenthesis ||
      code === codes.rightParenthesis ||
      code === codes.backslash
    ) {
      effects.consume(code)
      return resourceDestination
    }

    return resourceDestination(code)
  }

  function informationBetween(code) {
    if (
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf ||
      code === codes.ht ||
      code === codes.vs ||
      code === codes.space
    ) {
      effects.consume(code)
      return informationBetween
    }

    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.leftParenthesis
    ) {
      effects.enter('resourceTitle')
      effects.enter('resourceTitleMarker')
      effects.consume(code)
      effects.exit('resourceTitleMarker')

      return code === codes.quotationMark
        ? titleDoubleQuotedBefore
        : code === codes.apostrophe
        ? titleSingleQuotedBefore
        : titleParenQuotedBefore
    }

    return informationEnd(code)
  }

  function titleDoubleQuotedBefore(code) {
    if (code === codes.quotationMark) {
      return titleEnd(code)
    }

    effects.enter('resourceTitleData')
    return titleDoubleQuoted(code)
  }

  function titleDoubleQuoted(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.quotationMark) {
      effects.exit('resourceTitleData')
      return titleEnd(code)
    }

    if (code === codes.backslash) {
      effects.consume(code)
      return titleDoubleQuotedEscape
    }

    effects.consume(code)
    return titleDoubleQuoted
  }

  function titleDoubleQuotedEscape(code) {
    if (code === codes.quotationMark || code === codes.backslash) {
      effects.consume(code)
      return titleDoubleQuoted
    }

    return titleDoubleQuoted(code)
  }

  function titleSingleQuotedBefore(code) {
    if (code === codes.apostrophe) {
      return titleEnd(code)
    }

    effects.enter('resourceTitleData')
    return titleSingleQuoted(code)
  }

  function titleSingleQuoted(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.apostrophe) {
      effects.exit('resourceTitleData')
      return titleEnd(code)
    }

    if (code === codes.backslash) {
      effects.consume(code)
      return titleSingleQuotedEscape
    }

    effects.consume(code)
    return titleSingleQuoted
  }

  function titleSingleQuotedEscape(code) {
    if (code === codes.apostrophe || code === codes.backslash) {
      effects.consume(code)
      return titleSingleQuoted
    }

    return titleSingleQuoted(code)
  }

  function titleParenQuotedBefore(code) {
    if (code === codes.rightParenthesis) {
      return titleEnd(code)
    }

    effects.enter('resourceTitleData')
    return titleParenQuoted(code)
  }

  function titleParenQuoted(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.rightParenthesis) {
      effects.exit('resourceTitleData')
      return titleEnd(code)
    }

    if (code === codes.backslash) {
      effects.consume(code)
      return titleParenQuotedEscape
    }

    effects.consume(code)
    return titleParenQuoted
  }

  function titleParenQuotedEscape(code) {
    if (code === codes.rightParenthesis || code === codes.backslash) {
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
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf ||
      code === codes.ht ||
      code === codes.vs ||
      code === codes.space
    ) {
      effects.consume(code)
      return titleAfter
    }

    return informationEnd(code)
  }

  function informationEnd(code) {
    if (code !== codes.rightParenthesis) {
      return nok(code)
    }

    effects.enter('resourceMarker')
    effects.consume(code)
    effects.exit('resourceMarker')
    effects.exit('resource')
    return ok
  }
}

function tokenizeReference(effects, ok, nok) {
  var content = false

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.leftSquareBracket) return nok(code)

    effects.enter('reference')
    effects.enter('referenceMarker')
    effects.consume(code)
    effects.exit('referenceMarker')
    return referenceStart
  }

  function referenceStart(code) {
    // Collapsed.
    if (code === codes.rightSquareBracket) {
      return referenceEnd(code)
    }

    // Full.
    effects.enter('referenceData')
    return referenceData(code)
  }

  function referenceData(code) {
    if (code === codes.eof || code === codes.leftSquareBracket) {
      return nok(code)
    }

    // Full.
    if (code === codes.rightSquareBracket) {
      effects.exit('referenceData')
      return content ? referenceEnd(code) : nok(code)
    }

    if (
      content === false &&
      code !== codes.cr &&
      code !== codes.lf &&
      code !== codes.crlf &&
      code !== codes.ht &&
      code !== codes.vs &&
      code !== codes.space
    ) {
      content = true
    }

    effects.consume(code)
    return code === codes.backslash ? referenceEscape : referenceData
  }

  function referenceEscape(code) {
    if (
      code === codes.backslash ||
      code === codes.leftSquareBracket ||
      code === codes.rightSquareBracket
    ) {
      effects.consume(code)
      return referenceData
    }

    return referenceData(code)
  }

  function referenceEnd(code) {
    assert(code === codes.rightSquareBracket, 'expected `]`')
    effects.enter('referenceMarker')
    effects.consume(code)
    effects.exit('referenceMarker')
    effects.exit('reference')
    return ok
  }
}
