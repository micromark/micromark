exports.tokenize = whitespace
exports.resolve = resolveWhitespace

var codes = require('../character/codes')
var markdownLineEnding = require('../character/markdown-line-ending')
var markdownSpace = require('../character/markdown-space')
var constants = require('../constant/constants')
var types = require('../constant/types')
var shallow = require('../util/shallow')

function resolveWhitespace(events, context) {
  var head = events[0][1]
  var lineEnding = events.length > 2 && events[2][1]
  var result = events
  var token

  if (head.type === types.whitespace) {
    if (
      !head._tabs &&
      lineEnding &&
      lineEnding.type === types.lineEnding &&
      head._size >= constants.hardBreakPrefixSizeMin
    ) {
      token = {
        type: types.hardBreakTrailing,
        start: shallow(head.start),
        end: shallow(lineEnding.start)
      }

      result = [].concat(
        [['enter', token, context]],
        events.slice(0, 2),
        [['exit', token, context]],
        events.slice(2)
      )
    } else {
      head.type = types.lineSuffix
    }
  }

  return result
}

function whitespace(effects, ok, nok) {
  var token

  return start

  function start(code) {
    if (markdownSpace(code)) {
      token = effects.enter(types.whitespace)
      token._size = 0
      return whitespace(code)
    }

    // istanbul ignore next - Hooks.
    if (!markdownLineEnding(code)) {
      return nok(code)
    }

    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return atBreak
  }

  function whitespace(code) {
    if (code === codes.eof) {
      effects.exit(types.whitespace)
      return ok(code)
    }

    if (markdownSpace(code)) {
      effects.consume(code)
      token._size++

      if (code === codes.horizontalTab) {
        token._tabs = true
      }

      return whitespace
    }

    if (markdownLineEnding(code)) {
      effects.exit(types.whitespace)
      effects.enter(types.lineEnding)
      effects.consume(code)
      effects.exit(types.lineEnding)
      return atBreak
    }

    // Mark as normal data.
    token.type = types.data
    effects.exit(types.data)
    return ok(code)
  }

  function atBreak(code) {
    if (markdownSpace(code)) {
      effects.enter(types.linePrefix)
      effects.consume(code)
      return prefix
    }

    return ok(code)
  }

  function prefix(code) {
    if (markdownSpace(code)) {
      effects.consume(code)
      return prefix
    }

    effects.exit(types.linePrefix)
    return ok(code)
  }
}
