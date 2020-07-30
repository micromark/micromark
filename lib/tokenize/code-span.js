exports.tokenize = tokenizeCodeSpan
exports.resolve = resolveCodeSpan

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownEnding = require('../character/markdown-ending')
var types = require('../constant/types')

function resolveCodeSpan(events, context) {
  var length = events.length
  var headEnterIndex = 3
  var head = events[headEnterIndex][1]
  var tailExitIndex = length - 4
  var tail = events[tailExitIndex][1]
  var index
  var padded
  var content

  // If we start and end with whitespace.
  if (head.type === types.whitespace && tail.type === types.whitespace) {
    index = -1

    // Look for data.
    while (++index < length) {
      if (events[index][1].type === types.codeSpanData) {
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
    type: types.codeSpanData,
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
  var sizeOpen
  var sizeClose
  var token

  return this.previous === codes.graveAccent ? nok : start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.graveAccent) {
      return nok(code)
    }

    effects.enter(types.codeSpan)
    effects.enter(types.codeSpanFence)
    sizeOpen = 0
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

    effects.exit(types.codeSpanFence)
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
      token = effects.enter(types.codeSpanFence)
      sizeClose = 0
      return closingSequence(code)
    }

    // Tabs don’t work.
    if (markdownLineEnding(code) || code === codes.space) {
      effects.enter(types.whitespace)
      effects.consume(code)
      effects.exit(types.whitespace)
      return gap
    }

    // Data.
    effects.enter(types.codeSpanData)
    return data(code)
  }

  // In code.
  function data(code) {
    if (
      markdownEnding(code) ||
      code === codes.space ||
      code === codes.graveAccent
    ) {
      effects.exit(types.codeSpanData)
      return gap(code)
    }

    effects.consume(code)
    return data
  }

  // Closing fence.
  function closingSequence(code) {
    // More.
    if (code === codes.graveAccent) {
      sizeClose++
      effects.consume(code)
      return closingSequence
    }

    // Done!
    if (sizeClose === sizeOpen) {
      effects.exit(types.codeSpanFence)
      effects.exit(types.codeSpan)
      return ok(code)
    }

    // More or less accents: mark as data.
    token.type = types.codeSpanData
    return data(code)
  }
}
