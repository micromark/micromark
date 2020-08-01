exports.tokenize = tokenizeParagraph
exports.resolve = resolveParagraph

var assert = require('assert')
var codes = require('../character/codes')
var markdownEnding = require('../character/markdown-ending')
var types = require('../constant/types')

function resolveParagraph(events) {
  events[0][1].contentType = 'text'
  return events
}

function tokenizeParagraph(effects, ok) {
  return start

  function start(code) {
    effects.enter(types.paragraph)
    assert(!markdownEnding(code), 'expected non-EOF/EOL')
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
