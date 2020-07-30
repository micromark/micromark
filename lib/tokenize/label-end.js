exports.tokenize = tokenizeLabelEnd
exports.resolveTo = resolveTo
exports.resolveAll = resolveAll

var assert = require('assert')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var markdownEnding = require('../character/markdown-ending')
var asciiControl = require('../character/ascii-control')
var codes = require('../character/codes')
var types = require('../constant/types')
var shallow = require('../util/shallow')
var tokenizeEvent = require('../util/tokenize-event')
var resolveAllAttention = require('./attention').resolveAll

var resource = {tokenize: tokenizeResource}
var reference = {tokenize: tokenizeReference}

function resolveAll(events) {
  var length = events.length
  var index = -1
  var token

  while (++index < length) {
    token = events[index][1]

    if (
      !token._used &&
      (token.type === types.labelImage ||
        token.type === types.labelLink ||
        token.type === types.labelEnd)
    ) {
      token.type = types.data
    }
  }

  return events
}

function resolveTo(events, context) {
  var index = events.length
  var kind
  var open
  var close
  var end
  var group
  var label
  var text
  var event
  var token
  var type
  var openIndex
  var closeIndex
  var titleIndex
  var destinationIndex
  var referenceIndex
  var referenceTextIndex
  var result

  // Find an opening.
  while (index--) {
    event = events[index]
    token = event[1]

    if (event[0] === 'exit' && closeIndex === undefined) {
      if (!token._used && token.type === types.labelEnd) {
        closeIndex = index
      }

      if (token.type === types.resource) {
        kind = token.type
      }

      if (token.type === types.resourceTitleText) {
        titleIndex = index
      }

      if (token.type === types.resourceDestinationText) {
        destinationIndex = index
      }
    }

    if (event[0] === 'enter') {
      // Find where the link or image starts.
      if (openIndex === undefined) {
        if (token.type === types.reference) {
          referenceIndex = index
        }

        if (token.type === types.referenceText) {
          referenceTextIndex = index
        }

        if (
          (token.type === types.labelImage || token.type === types.labelLink) &&
          !token._inactive &&
          !token._used
        ) {
          openIndex = index
          type = token.type === types.labelLink ? types.link : types.image
        }
      }
      // More openings before our start.
      else {
        // Mark other link openings as data, as we can’t have links in links.
        if (type === types.link && token.type === types.labelLink) {
          token._inactive = true
        }
      }
    }
  }

  // Note: we will now always find open and close tokens, because we check for
  // an opening before trying to parse, and will always create a closing.
  open = events[openIndex][1]
  close = events[closeIndex][1]

  // Mark open and close as used.
  open._used = true
  close._used = true

  label = {
    type: types.label,
    start: shallow(open.start),
    end: shallow(close.end)
  }
  text = {
    type: types.labelText,
    start: shallow(open.end),
    end: shallow(close.start)
  }

  if (kind === types.resource) {
    // No destination: `[text]()`
    if (destinationIndex) {
      result = events
        .slice(closeIndex + 1, destinationIndex)
        .concat(
          tokenizeEvent(events[destinationIndex], context.parser.plainText)
        )

      if (titleIndex) {
        result = result.concat(
          events.slice(destinationIndex, titleIndex),
          tokenizeEvent(events[titleIndex], context.parser.plainText),
          events.slice(titleIndex)
        )
      }
      // No or empty title: `[text](<>)`, `[text](<> "")`
      else {
        result = result.concat(events.slice(destinationIndex))
      }
    } else {
      result = events.slice(closeIndex + 1)
    }
  }
  // Reference.
  else {
    // Full (`[text][label]`).
    if (referenceTextIndex) {
      result = [].concat(
        events.slice(referenceIndex, referenceTextIndex + 1),
        tokenizeEvent(events[referenceTextIndex], context.parser.plainText),
        events.slice(referenceTextIndex + 1)
      )
    }
    // Collaped (`[text][]`).
    else if (referenceIndex) {
      result = events.slice(referenceIndex)
    }
    // Shortcut (`[text]`).
    else {
      result = []
    }
  }

  end = events[events.length - 1][1]
  group = {type: type, start: shallow(open.start), end: shallow(end.end)}

  return [].concat(
    events.slice(0, openIndex),
    [
      ['enter', group, context],
      ['enter', label, context],
      events[openIndex],
      ['enter', text, context]
    ],
    resolveAllAttention(events.slice(openIndex + 1, closeIndex), context),
    [['exit', text, context], events[closeIndex], ['exit', label, context]],
    result,
    [['exit', group, context]]
  )
}

function tokenizeLabelEnd(effects, ok, nok) {
  var preceding = getStart(this.queue)

  return preceding ? start : nok

  function getStart(events) {
    var index = events.length
    var token

    // Find an opening.
    while (index--) {
      token = events[index][1]

      if (
        !token._used &&
        (token.type === types.labelImage || token.type === types.labelLink)
      ) {
        return token
      }
    }

    return undefined
  }

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.rightSquareBracket) {
      return nok(code)
    }

    // It’s a balanced bracket, hackily mark the preceding as `data`.
    if (preceding._inactive) {
      preceding.type = types.data
      return nok
    }

    effects.enter(types.labelEnd)
    effects.enter(types.labelMarker)
    effects.consume(code)
    effects.exit(types.labelMarker)
    effects.exit(types.labelEnd)
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
  var marker

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.leftParenthesis) return nok(code)

    effects.enter(types.resource)
    effects.enter(types.resourceMarker)
    effects.consume(code)
    effects.exit(types.resourceMarker)
    return open
  }

  function open(code) {
    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return open
    }

    if (
      code === codes.eof ||
      code === codes.rightParenthesis ||
      asciiControl(code)
    ) {
      return end(code)
    }

    effects.enter(types.resourceDestination)

    if (code === codes.lessThan) {
      effects.enter(types.resourceDestinationLiteral)
      effects.enter(types.resourceDestinationLiteralMarker)
      effects.consume(code)
      effects.exit(types.resourceDestinationLiteralMarker)
      return destinationEnclosedBefore
    }

    effects.enter(types.resourceDestinationRaw)
    effects.enter(types.resourceDestinationText)
    return destinationRaw(code)
  }

  function destinationEnclosedBefore(code) {
    if (code === codes.greaterThan) {
      return destinationEnclosedAfter(code)
    }

    effects.enter(types.resourceDestinationText)
    return destinationEnclosed(code)
  }

  function destinationEnclosed(code) {
    if (markdownEnding(code) || code === codes.lessThan) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.exit(types.resourceDestinationText)
      return destinationEnclosedAfter(code)
    }

    effects.consume(code)
    return code === codes.backslash
      ? destinationEnclosedEscape
      : destinationEnclosed
  }

  function destinationEnclosedEscape(code) {
    if (
      code === codes.lessThan ||
      code === codes.greaterThan ||
      code === codes.backslash
    ) {
      effects.consume(code)
      return destinationEnclosed
    }

    return destinationEnclosed(code)
  }

  function destinationEnclosedAfter(code) {
    assert(code === codes.greaterThan, 'expected `>`')
    effects.enter(types.resourceDestinationLiteralMarker)
    effects.consume(code)
    effects.exit(types.resourceDestinationLiteralMarker)
    effects.exit(types.resourceDestinationLiteral)
    effects.exit(types.resourceDestination)
    return between
  }

  function destinationRaw(code) {
    if (markdownLineEndingOrSpace(code)) {
      effects.exit(types.resourceDestinationText)
      effects.exit(types.resourceDestinationRaw)
      effects.exit(types.resourceDestination)
      return between(code)
    }

    if (code === codes.eof || asciiControl(code)) {
      return nok(code)
    }

    if (code === codes.leftParenthesis) {
      balance++
      effects.consume(code)
      return destinationRaw
    }

    if (code === codes.rightParenthesis) {
      if (!balance) {
        effects.exit(types.resourceDestinationText)
        effects.exit(types.resourceDestinationRaw)
        effects.exit(types.resourceDestination)
        return end(code)
      }

      balance--
      effects.consume(code)
      return destinationRaw
    }

    effects.consume(code)
    return code === codes.backslash ? destinationRawEscape : destinationRaw
  }

  function destinationRawEscape(code) {
    if (
      code === codes.leftParenthesis ||
      code === codes.rightParenthesis ||
      code === codes.backslash
    ) {
      effects.consume(code)
      return destinationRaw
    }

    return destinationRaw(code)
  }

  function between(code) {
    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return between
    }

    if (
      code === codes.quotationMark ||
      code === codes.apostrophe ||
      code === codes.leftParenthesis
    ) {
      effects.enter(types.resourceTitle)
      effects.enter(types.resourceTitleMarker)
      effects.consume(code)
      effects.exit(types.resourceTitleMarker)
      marker = code === codes.leftParenthesis ? codes.rightParenthesis : code

      return titleStart
    }

    return end(code)
  }

  function titleStart(code) {
    if (code === marker) {
      return titleEnd(code)
    }

    effects.enter(types.resourceTitleText)
    return title(code)
  }

  function title(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === marker) {
      effects.exit(types.resourceTitleText)
      return titleEnd(code)
    }

    effects.consume(code)
    return code === codes.backslash ? titleEscape : title
  }

  function titleEscape(code) {
    if (code === marker || code === codes.backslash) {
      effects.consume(code)
      return title
    }

    return title(code)
  }

  // Only used for valid endings.
  function titleEnd(code) {
    assert(code === marker, 'expected proper title end marker')
    effects.enter(types.resourceTitleMarker)
    effects.consume(code)
    effects.exit(types.resourceTitleMarker)
    effects.exit(types.resourceTitle)
    return titleAfter
  }

  function titleAfter(code) {
    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return titleAfter
    }

    return end(code)
  }

  function end(code) {
    if (code !== codes.rightParenthesis) {
      return nok(code)
    }

    effects.enter(types.resourceMarker)
    effects.consume(code)
    effects.exit(types.resourceMarker)
    effects.exit(types.resource)
    return ok
  }
}

function tokenizeReference(effects, ok, nok) {
  var data

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.leftSquareBracket) return nok(code)

    effects.enter(types.reference)
    effects.enter(types.referenceMarker)
    effects.consume(code)
    effects.exit(types.referenceMarker)
    return open
  }

  function open(code) {
    // Collapsed.
    if (code === codes.rightSquareBracket) {
      return end(code)
    }

    // Full.
    effects.enter(types.referenceText)
    return referenceData(code)
  }

  function referenceData(code) {
    if (code === codes.eof || code === codes.leftSquareBracket) {
      return nok(code)
    }

    // Full.
    if (code === codes.rightSquareBracket) {
      effects.exit(types.referenceText)
      return data ? end(code) : nok(code)
    }

    if (!markdownLineEndingOrSpace(code)) {
      data = true
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

  function end(code) {
    assert(code === codes.rightSquareBracket, 'expected `]`')
    effects.enter(types.referenceMarker)
    effects.consume(code)
    effects.exit(types.referenceMarker)
    effects.exit(types.reference)
    return ok
  }
}
