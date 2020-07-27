exports.tokenize = tokenizeParagraph
exports.resolve = resolveParagraph

var assert = require('assert')
var codes = require('../character/codes')
var markdownEnding = require('../character/markdown-ending')
var types = require('../constant/types')
var core = require('../core')
var tokenizeEvent = require('../util/tokenize-event')

function tokenizeParagraph(effects, ok) {
  return start

  function start(code) {
    assert(!markdownEnding(code), 'expected non-EOF/EOL')
    effects.enter(types.paragraph)
    return data(code)
  }

  function data(code) {
    if (code === codes.eof) {
      effects.exit(types.paragraph)
      return ok(code)
    }

    // Data.
    effects.consume(code)
    return data
  }
}

function resolveParagraph(events) {
  return [].concat(
    events.slice(0, 1),
    tokenizeEvent(events[0], core.text),
    events.slice(-1)
  )
}
