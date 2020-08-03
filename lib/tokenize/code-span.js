exports.tokenize = tokenizeCodeSpan
exports.resolve = resolveCodeSpan

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownEnding = require('../character/markdown-ending')
var types = require('../constant/types')

function resolveCodeSpan(events, context) {
  var length = events.length
  var tailExitIndex = length - 4
  var headEnterIndex = 3
  var tail = events[tailExitIndex][1]
  var head = events[headEnterIndex][1]
  var index
  var padded
  var content

  // If we start and end with whitespace.
  if (head.type === types.whitespace && tail.type === types.whitespace) {
    index = -1

    // Look for data.
    while (++index < length) {
      if (events[index][1].type === types.codeSpanValue) {
        padded = true
        break
      }
    }
  }

  if (padded) {
    headEnterIndex += 2
    tailExitIndex -= 2
  }

  content = {
    type: types.codeSpanValue,
    start: events[headEnterIndex][1].start,
    end: events[tailExitIndex][1].end
  }

  return [].concat(
    events.slice(0, headEnterIndex),
    [
      ['enter', content, context],
      ['exit', content, context]
    ],
    events.slice(tailExitIndex + 1)
  )
}

function tokenizeCodeSpan(effects, ok, nok) {
  var tail = this.events[this.events.length - 1]
  var previous = this.previous
  var sizeOpen = 0
  var size
  var token

  return start

  function start(code) {
    if (
      code !== codes.graveAccent ||
      // If `previous` is set, there will always be a tail.
      (previous === codes.graveAccent && tail[1].type !== types.characterEscape)
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

    // Tabs don’t work, and virtual spaces don’t make sense.
    if (code === codes.space || markdownLineEnding(code)) {
      effects.enter(types.whitespace)
      effects.consume(code)
      effects.exit(types.whitespace)
      return gap
    }

    // Data.
    effects.enter(types.codeSpanValue)
    return data(code)
  }

  // In code.
  function data(code) {
    if (
      code === codes.space ||
      code === codes.graveAccent ||
      markdownEnding(code)
    ) {
      effects.exit(types.codeSpanValue)
      return gap(code)
    }

    effects.consume(code)
    return data
  }

  // Closing fence.
  function closingSequence(code) {
    // More.
    if (code === codes.graveAccent) {
      size++
      effects.consume(code)
      return closingSequence
    }

    // Done!
    if (size === sizeOpen) {
      effects.exit(types.codeSpanSequence)
      effects.exit(types.codeSpan)
      return ok(code)
    }

    // More or less accents: mark as data.
    token.type = types.codeSpanValue
    return data(code)
  }
}
