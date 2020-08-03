exports.tokenize = tokenizeLabelEnd
exports.resolveTo = resolveToLabelEnd
exports.resolveAll = resolveAllLabelEnd

var assert = require('assert')
var asciiControl = require('../character/ascii-control')
var codes = require('../character/codes')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var markdownEnding = require('../character/markdown-ending')
var types = require('../constant/types')
var normalizeIdentifier = require('../util/normalize-identifier')
var shallow = require('../util/shallow')
var resolveAllAttention = require('./attention').resolveAll

var resource = {tokenize: tokenizeResource}
var fullReference = {tokenize: tokenizeFullReference}
var collapsedReference = {tokenize: tokenizeCollapsedReference}

function resolveAllLabelEnd(events) {
  var length = events.length
  var index = -1
  var token

  while (++index < length) {
    token = events[index][1]

    // To do: remove `labelMarker` and such!
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

function resolveToLabelEnd(events, context) {
  var index = events.length
  var open
  var close
  var end
  var group
  var label
  var text
  var token
  var type
  var openIndex
  var closeIndex

  // Find an opening.
  while (index--) {
    token = events[index][1]

    if (events[index][0] === 'enter') {
      // More openings before our start.
      if (openIndex) {
        // Mark other link openings as data, as we can’t have links in links.
        if (type === types.link && token.type === types.labelLink) {
          token._inactive = true
        }
      }
      // Find where the link or image starts.
      else {
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
    // Exit.
    else {
      if (!closeIndex && !token._used && token.type === types.labelEnd) {
        closeIndex = index
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
    events.slice(closeIndex + 1),
    [['exit', group, context]]
  )
}

function tokenizeLabelEnd(effects, ok, nok) {
  var defined = this.parser.defined
  var sliceSerialize = this.sliceSerialize
  var events = this.events
  var index = events.length
  var labelStart
  var labelIdentifier

  // Find an opening.
  while (index--) {
    if (
      !events[index][1]._used &&
      (events[index][1].type === types.labelImage ||
        events[index][1].type === types.labelLink)
    ) {
      labelStart = events[index][1]
      break
    }
  }

  return start

  function start(code) {
    var labelEnd

    // istanbul ignore next - Hooks.
    if (code !== codes.rightSquareBracket || !labelStart) {
      return nok(code)
    }

    // It’s a balanced bracket, but contains a link.
    if (labelStart._inactive) {
      return balancedButNok(code)
    }

    labelEnd = effects.enter(types.labelEnd)
    labelIdentifier = normalizeIdentifier(
      sliceSerialize({start: labelStart.end, end: labelEnd.start})
    )
    effects.enter(types.labelMarker)
    effects.consume(code)
    effects.exit(types.labelMarker)
    effects.exit(types.labelEnd)
    return afterLabelEnd
  }

  function afterLabelEnd(code) {
    // Resource: `[asd](fgh)`.
    if (code === codes.leftParenthesis) {
      return effects.createConstructAttempt(resource, ok, maybeShortcut)(code)
    }

    // Collapsed (`[asd][]`) or full (`[asd][fgh]`) reference?
    if (code === codes.leftSquareBracket) {
      return effects.createConstructAttempt(
        fullReference,
        ok,
        maybeCollapsed
      )(code)
    }

    // Shortcut reference: `[asd]`?
    return maybeShortcut(code)
  }

  function maybeCollapsed(code) {
    return defined.indexOf(labelIdentifier) > -1
      ? effects.createConstructAttempt(
          collapsedReference,
          ok,
          balancedButNok
        )(code)
      : balancedButNok(code)
  }

  function maybeShortcut(code) {
    return defined.indexOf(labelIdentifier) > -1
      ? ok(code)
      : balancedButNok(code)
  }

  function balancedButNok(code) {
    labelStart.type = types.data
    return nok(code)
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
    effects.enter(types.resourceDestinationString).contentType = 'string'
    return destinationRaw(code)
  }

  function destinationEnclosedBefore(code) {
    if (code === codes.greaterThan) {
      return destinationEnclosedAfter(code)
    }

    effects.enter(types.resourceDestinationString).contentType = 'string'
    return destinationEnclosed(code)
  }

  function destinationEnclosed(code) {
    if (code === codes.lessThan || markdownEnding(code)) {
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

    if (markdownLineEndingOrSpace(code)) {
      effects.exit(types.resourceDestinationString)
      effects.exit(types.resourceDestinationRaw)
      effects.exit(types.resourceDestination)
      return between(code)
    }

    if (asciiControl(code)) {
      return nok(code)
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

    if (markdownLineEndingOrSpace(code)) {
      effects.consume(code)
      return between
    }

    return end(code)
  }

  function titleStart(code) {
    if (code === marker) {
      return titleEnd(code)
    }

    effects.enter(types.resourceTitleString).contentType = 'string'
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

function tokenizeFullReference(effects, ok, nok) {
  var defined = this.parser.defined
  var sliceSerialize = this.sliceSerialize
  var data

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.leftSquareBracket) return nok(code)

    effects.enter(types.reference)
    effects.enter(types.referenceMarker)
    effects.consume(code)
    effects.exit(types.referenceMarker)
    effects.enter(types.referenceString).contentType = 'string'
    return referenceData
  }

  function referenceData(code) {
    var token

    if (code === codes.eof || code === codes.leftSquareBracket) {
      return nok(code)
    }

    // Full.
    if (code === codes.rightSquareBracket) {
      if (!data) {
        return nok(code)
      }

      token = effects.exit(types.referenceString)
      return defined.indexOf(normalizeIdentifier(sliceSerialize(token))) < 0
        ? nok(code)
        : end(code)
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

function tokenizeCollapsedReference(effects, ok, nok) {
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
    if (code !== codes.rightSquareBracket) return nok(code)
    effects.enter(types.referenceMarker)
    effects.consume(code)
    effects.exit(types.referenceMarker)
    effects.exit(types.reference)
    return ok
  }
}
