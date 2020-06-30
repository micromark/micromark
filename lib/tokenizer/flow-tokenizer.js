'use strict'

module.exports = flow

var assert = require('assert')
var characters = require('../util/characters')
var atxHeading = require('../tokenize/flow/atx-heading')
var fencedCode = require('../tokenize/flow/fenced-code')
var html = require('../tokenize/flow/html')
var indentedCode = require('../tokenize/flow/indented-code')
var thematicBreak = require('../tokenize/flow/thematic-break')
var core = require('../core')

function flow(effects) {
  var initialHooks = {}
  var prefixedHooks = {}

  initialHooks[characters.tab] = indentedCode
  initialHooks[characters.space] = indentedCode

  prefixedHooks[characters.numberSign] = atxHeading
  prefixedHooks[characters.asterisk] = thematicBreak
  prefixedHooks[characters.dash] = thematicBreak
  prefixedHooks[characters.lessThan] = html
  prefixedHooks[characters.underscore] = thematicBreak
  prefixedHooks[characters.graveAccent] = fencedCode
  prefixedHooks[characters.tilde] = fencedCode

  var content = {tokenize: tokenizeContent, resolve: resolveContent}
  var initial = effects.createHookableState(
    initialHooks,
    afterInitialConstruct,
    prefixStart
  )
  var prefixed = effects.createHookableState(
    prefixedHooks,
    afterPrefixedConstruct,
    nonPrefixedConstruct
  )

  return initial

  function afterInitialConstruct(code) {
    // Make sure we eat EOFs.
    if (code === characters.eof) {
      effects.consume(code)
      return afterInitialConstruct
    }

    return initial
  }

  function prefixStart(code) {
    if (code === characters.tab || code === characters.space) {
      effects.enter('linePrefix')
      effects.consume(code)
      return prefixContinuation
    }

    return prefixed
  }

  function prefixContinuation(code) {
    if (code === characters.tab || code === characters.space) {
      effects.consume(code)
      return prefixContinuation
    }

    effects.exit('linePrefix')
    return prefixed
  }

  function afterPrefixedConstruct(code) {
    // Make sure we eat EOFs.
    if (code === characters.eof) {
      effects.consume(code)
      return afterPrefixedConstruct
    }

    assert(code, characters.lineFeed, 'expected an EOF or EOL for this state')

    effects.enter('lineFeed')
    effects.consume(code)
    effects.exit('lineFeed')
    return initial
  }

  function nonPrefixedConstruct() {
    return effects.createConstruct(content, afterPrefixedConstruct)
  }

  function tokenizeContent(effects, ok) {
    return start

    function start(code) {
      if (code === characters.eof || code === characters.lineFeed) {
        return ok(code)
      }

      effects.enter('paragraph')
      return data(code)
    }

    function data(code) {
      // code === lineFeed ||
      if (code === characters.eof) {
        effects.exit('paragraph')
        return ok(code)
      }

      // Data.
      effects.consume(code)
      return data
    }
  }

  function resolveContent(events) {
    // Empty (a blank line)
    if (events.length === 0) {
      return events
    }

    var content = events[0][1]
    var tokenizer = core.text(content.start)
    var d = events[0][2].sliceStream(content).concat(null)
    var b = d.flatMap(tokenizer)

    return [].concat(events.slice(0, 1), b, events.slice(-1))
  }
}
