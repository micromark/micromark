exports.tokenize = whitespace
exports.resolve = resolveWhitespace

var assert = require('assert')
var codes = require('../../character/codes')
var clone = require('../../util/clone-point')

var hardBreakMin = 2

function resolveWhitespace(events) {
  var head = events[0][1]
  var lineEnding = events.length > 2 ? events[2][1] : undefined
  var hardBreak
  var result = events

  if (head.type === 'whitespace') {
    if (
      head.size >= hardBreakMin &&
      head.spaceOnly === true &&
      lineEnding &&
      lineEnding.type === 'lineEnding'
    ) {
      hardBreak = {
        type: 'hardBreakTrailing',
        start: clone(head.start),
        end: clone(lineEnding.end)
      }

      result = [].concat(
        [['enter', hardBreak, events[0][2]]],
        events.slice(0, 2),
        [['exit', hardBreak, events[0][2]]],
        events.slice(2)
      )
    } else {
      head.type = 'lineSuffix'
    }
  }

  return result
}

function whitespace(effects, ok) {
  var whitespaceToken

  return start

  function start(code) {
    if (code === codes.ht || code === codes.vs || code === codes.space) {
      whitespaceToken = effects.enter('whitespace')
      whitespaceToken.size = 1
      whitespaceToken.spaceOnly = code !== codes.ht

      effects.consume(code)
      return whitespace
    }

    assert(
      code === codes.cr || code === codes.lf || code === codes.crlf,
      'expected whitespace or EOL for this state'
    )

    effects.enter('lineEnding')
    effects.consume(code)
    effects.exit('lineEnding')
    return atBreak
  }

  function whitespace(code) {
    if (code === codes.eof) {
      effects.exit('whitespace')
      return ok(code)
    }

    if (code === codes.ht || code === codes.vs || code === codes.space) {
      whitespaceToken.size++

      if (code === codes.ht) {
        whitespaceToken.spaceOnly = false
      }

      effects.consume(code)
      return whitespace
    }

    if (code === codes.cr || code === codes.lf || code === codes.crlf) {
      effects.exit('whitespace')
      effects.enter('lineEnding')
      effects.consume(code)
      effects.exit('lineEnding')
      return atBreak
    }

    // Mark as normal data.
    whitespaceToken.type = 'data'
    effects.exit('data')
    return ok(code)
  }

  function atBreak(code) {
    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.enter('linePrefix')
      effects.consume(code)
      return prefix
    }

    return ok(code)
  }

  function prefix(code) {
    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.consume(code)
      return prefix
    }

    effects.exit('linePrefix')
    return ok(code)
  }
}
