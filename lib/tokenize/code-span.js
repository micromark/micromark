exports.tokenize = tokenizeCodeSpan
exports.resolve = resolveCodeSpan

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var types = require('../constant/types')

function resolveCodeSpan(events) {
  var length = events.length
  var tailExitIndex = length - 4
  var headEnterIndex = 3
  var tail = events[tailExitIndex][1]
  var head = events[headEnterIndex][1]
  var token
  var index

  // If we start and end with whitespace.
  if (
    (head.type === types.codeSpanPaddingLineEnding ||
      head.type === types.codeSpanPaddingWhitespace) &&
    (tail.type === types.codeSpanPaddingLineEnding ||
      tail.type === types.codeSpanPaddingWhitespace)
  ) {
    index = headEnterIndex

    // Look for data.
    while (++index < tailExitIndex) {
      if (events[index][1].type === types.data) {
        headEnterIndex += 2
        tailExitIndex -= 2
        break
      }
    }
  }

  index = headEnterIndex - 1
  while (++index < tailExitIndex) {
    token = events[index][1]

    if (token.type === types.codeSpanPaddingLineEnding) {
      token.type = types.lineEnding
    } else if (token.type === types.codeSpanPaddingWhitespace) {
      token.type = types.data
    }
  }

  return events
}

function tokenizeCodeSpan(effects, ok, nok) {
  var self = this
  var sizeOpen = 0
  var size
  var token

  return start

  function start(code) {
    if (
      code !== codes.graveAccent ||
      // If `previous` is set, there will always be a tail.
      (self.previous === codes.graveAccent &&
        self.events[self.events.length - 1][1].type !== types.characterEscape)
    ) {
      return nok(code)
    }

    effects.enter(types.codeSpan)
    effects.enter(types.codeSpanSequence)
    return openingSequence(code)
  }

  // Opening fence.
  function openingSequence(code) {
    // More.
    if (code === codes.graveAccent) {
      effects.consume(code)
      sizeOpen++
      return openingSequence
    }

    effects.exit(types.codeSpanSequence)
    return gap(code)
  }

  function gap(code) {
    // EOF.
    if (code === codes.eof) {
      return nok(code)
    }

    // Closing fence?
    // Could also be data.
    if (code === codes.graveAccent) {
      token = effects.enter(types.codeSpanSequence)
      size = 0
      return closingSequence(code)
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.codeSpanPaddingLineEnding)
      effects.consume(code)
      effects.exit(types.codeSpanPaddingLineEnding)
      return gap
    }

    // Tabs don’t work, and virtual spaces don’t make sense.
    if (code === codes.space) {
      effects.enter(types.codeSpanPaddingWhitespace)
      effects.consume(code)
      effects.exit(types.codeSpanPaddingWhitespace)
      return gap
    }

    // Data.
    effects.enter(types.data)
    return data(code)
  }

  // In code.
  function data(code) {
    if (
      code === codes.eof ||
      code === codes.space ||
      code === codes.graveAccent ||
      markdownLineEnding(code)
    ) {
      effects.exit(types.data)
      return gap(code)
    }

    effects.consume(code)
    return data
  }

  // Closing fence.
  function closingSequence(code) {
    // More.
    if (code === codes.graveAccent) {
      effects.consume(code)
      size++
      return closingSequence
    }

    // Done!
    if (size === sizeOpen) {
      effects.exit(types.codeSpanSequence)
      effects.exit(types.codeSpan)
      return ok(code)
    }

    // More or less accents: mark as data.
    token.type = types.data
    return data(code)
  }
}
