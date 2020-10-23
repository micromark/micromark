exports.tokenize = tokenizeLineEnding

var assert = require('assert')
var markdownLineEnding = require('../character/markdown-line-ending')
var types = require('../constant/types')
var spaceFactory = require('./factory-space')

function tokenizeLineEnding(effects, ok) {
  return start

  function start(code) {
    assert(markdownLineEnding(code), 'expected eol')
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return spaceFactory(effects, ok, types.linePrefix)
  }
}
