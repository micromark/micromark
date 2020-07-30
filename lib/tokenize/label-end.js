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
  var referenceStringIndex
  var result

  // Find an opening.
  while (index--) {
    event = events[index]
    token = event[1]

    if (event[0] === 'exit' && !closeIndex) {
      if (!token._used && token.type === types.labelEnd) {
        closeIndex = index
      }

      if (token.type === types.resource) {
        kind = token.type
      }

      if (token.type === types.resourceTitleString) {
        titleIndex = index
      }

      if (token.type === types.resourceDestinationString) {
        destinationIndex = index
      }
    }

    if (event[0] === 'enter') {
      // More openings before our start.
      if (openIndex) {
        // Mark other link openings as data, as we can’t have links in links.
        if (type === types.link && token.type === types.labelLink) {
          token._inactive = true
        }
      }
      // Find where the link or image starts.
      else {
        if (token.type === types.reference) {
          referenceIndex = index
        }

        if (token.type === types.referenceString) {
          referenceStringIndex = index
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
        .concat(tokenizeEvent(events[destinationIndex], context.parser.string))

      if (titleIndex) {
        result = result.concat(
          events.slice(destinationIndex, titleIndex),
          tokenizeEvent(events[titleIndex], context.parser.string),
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
    if (referenceStringIndex) {
      result = [].concat(
        events.slice(referenceIndex, referenceStringIndex + 1),
        tokenizeEvent(events[referenceStringIndex], context.parser.string),
        events.slice(referenceStringIndex + 1)
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
  var events = this.queue

  return start

  function start(code) {
    var index = events.length
    var token
    var preceding

    // Find an opening.
    while (index--) {
      token = events[index][1]

      if (
        !token._used &&
        (token.type === types.labelImage || token.type === types.labelLink)
      ) {
        preceding = true
        break
      }
    }

    // istanbul ignore next - Hooks.
    if (code !== codes.rightSquareBracket || !preceding) {
      return nok(code)
    }

    // It’s a balanced bracket, hackily mark the preceding as `data`.
    if (token._inactive) {
      token.type = types.data
      return nok(code)
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

    if (code === codes.rightParenthesis || asciiControl(code)) {
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
    effects.enter(types.resourceDestinationString)
    return destinationRaw(code)
  }

  function destinationEnclosedBefore(code) {
    if (code === codes.greaterThan) {
      return destinationEnclosedAfter(code)
    }

    effects.enter(types.resourceDestinationString)
    return destinationEnclosed(code)
  }

  function destinationEnclosed(code) {
    if (markdownEnding(code) || code === codes.lessThan) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.exit(types.resourceDestinationString)
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
    assert.equal(code, codes.greaterThan, 'expected `>`')
    effects.enter(types.resourceDestinationLiteralMarker)
    effects.consume(code)
    effects.exit(types.resourceDestinationLiteralMarker)
    effects.exit(types.resourceDestinationLiteral)
    effects.exit(types.resourceDestination)
    return between
  }

  function destinationRaw(code) {
    if (markdownLineEndingOrSpace(code)) {
      effects.exit(types.resourceDestinationString)
      effects.exit(types.resourceDestinationRaw)
      effects.exit(types.resourceDestination)
      return between(code)
    }

    if (asciiControl(code)) {
      return nok(code)
    }

    if (code === codes.leftParenthesis) {
      balance++
      effects.consume(code)
      return destinationRaw
    }

    if (code === codes.rightParenthesis) {
      if (!balance) {
        effects.exit(types.resourceDestinationString)
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

    effects.enter(types.resourceTitleString)
    return title(code)
  }

  function title(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === marker) {
      effects.exit(types.resourceTitleString)
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
    assert.equal(code, marker, 'expected proper title end marker')
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
    effects.enter(types.referenceString)
    return referenceData(code)
  }

  function referenceData(code) {
    if (code === codes.eof || code === codes.leftSquareBracket) {
      return nok(code)
    }

    // Full.
    if (code === codes.rightSquareBracket) {
      effects.exit(types.referenceString)
      return data ? end(code) : nok(code)
    }

    effects.consume(code)

    if (!markdownLineEndingOrSpace(code)) {
      data = true
    }

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
    assert.equal(code, codes.rightSquareBracket, 'expected `]`')
    effects.enter(types.referenceMarker)
    effects.consume(code)
    effects.exit(types.referenceMarker)
    effects.exit(types.reference)
    return ok
  }
}
