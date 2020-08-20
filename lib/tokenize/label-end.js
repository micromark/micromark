exports.tokenize = tokenizeLabelEnd
exports.resolveTo = resolveToLabelEnd
exports.resolveAll = resolveAllLabelEnd

var assert = require('assert')
var asciiControl = require('../character/ascii-control')
var codes = require('../character/codes')
var markdownLineEndingOrSpace = require('../character/markdown-line-ending-or-space')
var markdownLineEnding = require('../character/markdown-line-ending')
var constants = require('../constant/constants')
var types = require('../constant/types')
var normalizeIdentifier = require('../util/normalize-identifier')
var shallow = require('../util/shallow')
var resolveAllAttention = require('./attention').resolveAll
var spaceOrLineEnding = require('./partial-space-or-line-ending')
var createSpaceTokenizer = require('./partial-space')

var resource = {tokenize: tokenizeResource}
var fullReference = {tokenize: tokenizeFullReference}
var collapsedReference = {tokenize: tokenizeCollapsedReference}

function resolveAllLabelEnd(events) {
  var length = events.length
  var index = -1
  var token

  while (++index < length) {
    token = events[index][1]

    if (
      events[index][0] === 'enter' &&
      ((!token._used &&
        (token.type === types.labelImage ||
          token.type === types.labelLink ||
          token.type === types.labelEnd)) ||
        (token.type === types.data && token._wasLabel))
    ) {
      token.type = types.data
      // Remove the marker.
      events.splice(index + 1, 2)
      length -= 2
    }
  }

  return events
}

function resolveToLabelEnd(events, context) {
  var index = events.length
  var group
  var label
  var text
  var token
  var type
  var openIndex
  var closeIndex
  var offset

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
          offset = token.type === types.labelLink ? 0 : 2
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

  group = {
    type: type,
    start: shallow(events[openIndex][1].start),
    end: shallow(events[events.length - 1][1].end)
  }

  label = {
    type: types.label,
    start: shallow(events[openIndex][1].start),
    end: shallow(events[closeIndex][1].end)
  }

  text = {
    type: types.labelText,
    start: shallow(events[openIndex + offset + 2][1].end),
    end: shallow(events[closeIndex - 2][1].start)
  }

  return [].concat(
    events.slice(0, openIndex),
    [
      ['enter', group, context],
      ['enter', label, context]
    ],
    // Opening marker.
    events.slice(openIndex + 1, openIndex + offset + 3),
    [['enter', text, context]],
    resolveAllAttention(
      events.slice(openIndex + offset + 4, closeIndex - 3),
      context
    ),
    [['exit', text, context]],
    // Closing marker.
    events.slice(closeIndex - 2, closeIndex),
    [['exit', label, context]],
    events.slice(closeIndex + 1),
    [['exit', group, context]]
  )
}

function tokenizeLabelEnd(effects, ok, nok) {
  var self = this
  var labelStart
  var labelIdentifier

  return start

  function start(code) {
    var index = self.events.length
    var labelEnd

    // Find an opening.
    while (index--) {
      if (
        !self.events[index][1]._used &&
        (self.events[index][1].type === types.labelImage ||
          self.events[index][1].type === types.labelLink)
      ) {
        labelStart = self.events[index][1]
        break
      }
    }

    // istanbul ignore next - Hooks.
    if (code !== codes.rightSquareBracket || !labelStart) {
      return nok(code)
    }

    // It’s a balanced bracket, but contains a link.
    if (labelStart._inactive) {
      return balancedButNok(code)
    }

    labelEnd = effects.enter(types.labelEnd)
    effects.enter(types.labelMarker)
    effects.consume(code)
    effects.exit(types.labelMarker)
    effects.exit(types.labelEnd)
    labelIdentifier = normalizeIdentifier(
      self.sliceSerialize({start: labelStart.end, end: labelEnd.start})
    )
    return afterLabelEnd
  }

  function afterLabelEnd(code) {
    // Resource: `[asd](fgh)`.
    if (code === codes.leftParenthesis) {
      return effects.attempt(resource, ok, maybeShortcut)(code)
    }

    // Collapsed (`[asd][]`) or full (`[asd][fgh]`) reference?
    if (code === codes.leftSquareBracket) {
      return effects.attempt(fullReference, ok, maybeCollapsed)(code)
    }

    // Shortcut reference: `[asd]`?
    return maybeShortcut(code)
  }

  function maybeCollapsed(code) {
    return self.parser.defined.indexOf(labelIdentifier) < 0
      ? balancedButNok(code)
      : effects.attempt(collapsedReference, ok, balancedButNok)(code)
  }

  function maybeShortcut(code) {
    return self.parser.defined.indexOf(labelIdentifier) < 0
      ? balancedButNok(code)
      : ok(code)
  }

  function balancedButNok(code) {
    labelStart.type = types.data
    labelStart._wasLabel = true
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
    return effects.attempt(spaceOrLineEnding, open)
  }

  function open(code) {
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
    effects.enter(types.chunkString).contentType = constants.contentTypeString
    return destinationRaw(code)
  }

  function destinationEnclosedBefore(code) {
    if (code === codes.greaterThan) {
      return destinationEnclosedEnd(code)
    }

    effects.enter(types.resourceDestinationString)
    effects.enter(types.chunkString).contentType = constants.contentTypeString
    return destinationEnclosed(code)
  }

  function destinationEnclosed(code) {
    if (
      code === codes.eof ||
      code === codes.lessThan ||
      markdownLineEnding(code)
    ) {
      return nok(code)
    }

    if (code === codes.greaterThan) {
      effects.exit(types.chunkString)
      effects.exit(types.resourceDestinationString)
      return destinationEnclosedEnd(code)
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

  function destinationEnclosedEnd(code) {
    assert.equal(code, codes.greaterThan, 'expected `>`')
    effects.enter(types.resourceDestinationLiteralMarker)
    effects.consume(code)
    effects.exit(types.resourceDestinationLiteralMarker)
    effects.exit(types.resourceDestinationLiteral)
    effects.exit(types.resourceDestination)
    return destinationEnclosedAfter
  }

  function destinationEnclosedAfter(code) {
    return markdownLineEndingOrSpace(code)
      ? effects.attempt(spaceOrLineEnding, between)(code)
      : end(code)
  }

  function destinationRaw(code) {
    if (code === codes.leftParenthesis) {
      if (++balance > constants.linkResourceDestinationBalanceMax) {
        return nok(code)
      }

      effects.consume(code)
      return destinationRaw
    }

    if (code === codes.rightParenthesis) {
      if (!balance) {
        effects.exit(types.chunkString)
        effects.exit(types.resourceDestinationString)
        effects.exit(types.resourceDestinationRaw)
        effects.exit(types.resourceDestination)
        return end(code)
      }

      effects.consume(code)
      balance--
      return destinationRaw
    }

    if (markdownLineEndingOrSpace(code)) {
      effects.exit(types.chunkString)
      effects.exit(types.resourceDestinationString)
      effects.exit(types.resourceDestinationRaw)
      effects.exit(types.resourceDestination)
      return effects.attempt(spaceOrLineEnding, between)(code)
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
      return atFirstTitleBreak
    }

    return end(code)
  }

  function atFirstTitleBreak(code) {
    if (code === marker) {
      return atTitleMarker(code)
    }

    effects.enter(types.resourceTitleString)
    return atTitleBreak(code)
  }

  function atTitleBreak(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === marker) {
      effects.exit(types.resourceTitleString)
      return atTitleMarker(code)
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return effects.attempt(
        createSpaceTokenizer(types.linePrefix, constants.tabSize),
        atTitleBreak
      )
    }

    effects.enter(types.chunkString).contentType = constants.contentTypeString
    return title(code)
  }

  function title(code) {
    if (code === codes.eof || code === marker || markdownLineEnding(code)) {
      effects.exit(types.chunkString)
      return atTitleBreak(code)
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

  function atTitleMarker(code) {
    assert.equal(code, marker, 'expected marker')
    effects.enter(types.resourceTitleMarker)
    effects.consume(code)
    effects.exit(types.resourceTitleMarker)
    effects.exit(types.resourceTitle)
    return effects.attempt(spaceOrLineEnding, end)
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
  var self = this
  var size = 0
  var data

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.leftSquareBracket) return nok(code)

    effects.enter(types.reference)
    effects.enter(types.referenceMarker)
    effects.consume(code)
    effects.exit(types.referenceMarker)
    effects.enter(types.referenceString)
    effects.enter(types.chunkString).contentType = constants.contentTypeString
    return referenceData
  }

  function referenceData(code) {
    var token

    if (
      code === codes.eof ||
      code === codes.leftSquareBracket ||
      size++ > constants.linkReferenceSizeMax
    ) {
      return nok(code)
    }

    // Full.
    if (code === codes.rightSquareBracket) {
      if (!data) {
        return nok(code)
      }

      effects.exit(types.chunkString)
      token = effects.exit(types.referenceString)
      return self.parser.defined.indexOf(
        normalizeIdentifier(self.sliceSerialize(token))
      ) < 0
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
      size++
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
