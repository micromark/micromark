exports.tokenize = tokenizeParagraph
exports.resolve = resolveParagraph

var assert = require('assert')
var codes = require('../../character/codes')
var markdownEnding = require('../../character/markdown-ending')
var core = require('../../core')
var tokenizeEvent = require('../../util/tokenize-event')

function tokenizeParagraph(effects, ok) {
  return start

  function start(code) {
    assert(!markdownEnding(code), 'expected anything other than EOF, EOL')
    effects.enter('paragraph')
    return data(code)
  }

  function data(code) {
    if (code === codes.eof) {
      effects.exit('paragraph')
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
