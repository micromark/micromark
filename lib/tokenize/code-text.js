exports.tokenize = tokenizeCodeText
exports.resolve = resolveCodeText
exports.previous = previous

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var types = require('../constant/types')

function resolveCodeText(events) {
  var length = events.length
  var tailExitIndex = length - 4
  var headEnterIndex = 3
  var tail = events[tailExitIndex][1]
  var head = events[headEnterIndex][1]
  var token
  var index

  // If we start and end with whitespace.
  if (
    (head.type === types.codeTextPaddingLineEnding ||
      head.type === types.codeTextPaddingWhitespace) &&
    (tail.type === types.codeTextPaddingLineEnding ||
      tail.type === types.codeTextPaddingWhitespace)
  ) {
    index = headEnterIndex

    // Look for data.
    while (++index < tailExitIndex) {
      if (events[index][1].type === types.codeTextData) {
        headEnterIndex += 2
        tailExitIndex -= 2
        break
      }
    }
  }

  index = headEnterIndex - 1
  while (++index < tailExitIndex) {
    token = events[index][1]

    if (token.type === types.codeTextPaddingLineEnding) {
      token.type = types.lineEnding
    } else if (token.type === types.codeTextPaddingWhitespace) {
      token.type = types.codeTextData
    }
  }

  return events
}

function previous(code) {
  // If there is a previous code, there will always be a tail.
  return (
    code !== codes.graveAccent ||
    this.events[this.events.length - 1][1].type === types.characterEscape
  )
}

function tokenizeCodeText(effects, ok, nok) {
  var self = this
  var sizeOpen = 0
  var size
  var token

  return start

  function start(code) {
    /* istanbul ignore next - hooks. */
    if (code !== codes.graveAccent || !previous.call(self, self.previous)) {
      return nok(code)
    }

    effects.enter(types.codeText)
    effects.enter(types.codeTextSequence)
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

    effects.exit(types.codeTextSequence)
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
      token = effects.enter(types.codeTextSequence)
      size = 0
      return closingSequence(code)
    }

    if (markdownLineEnding(code)) {
      effects.enter(types.codeTextPaddingLineEnding)
      effects.consume(code)
      effects.exit(types.codeTextPaddingLineEnding)
      return gap
    }

    // Tabs don’t work, and virtual spaces don’t make sense.
    if (code === codes.space) {
      effects.enter(types.codeTextPaddingWhitespace)
      effects.consume(code)
      effects.exit(types.codeTextPaddingWhitespace)
      return gap
    }

    // Data.
    effects.enter(types.codeTextData)
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
      effects.exit(types.codeTextData)
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
      effects.exit(types.codeTextSequence)
      effects.exit(types.codeText)
      return ok(code)
    }

    // More or less accents: mark as data.
    token.type = types.codeTextData
    return data(code)
  }
}
