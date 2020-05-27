'use strict'

module.exports = flow

var atxHeading = require('../tokenize/flow/atx-heading')
var fencedCode = require('../tokenize/flow/fenced-code')
var html = require('../tokenize/flow/html')
var indentedCode = require('../tokenize/flow/indented-code')
var thematicBreak = require('../tokenize/flow/thematic-break')
var core = require('../core')

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var space = 32 // ' '

function flow(effects) {
  var initialHooks = {
    9: indentedCode,
    32: indentedCode
  }
  var prefixedHooks = {
    35: atxHeading, // '#'
    42: thematicBreak, // '*'
    45: thematicBreak, // '-'
    60: html, // '<'
    95: thematicBreak, // '_'
    96: fencedCode, // '`'
    126: fencedCode // '~'
  }

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
    if (code !== code) {
      effects.consume(code)
      return afterInitialConstruct
    }

    return initial
  }

  function prefixStart(code) {
    if (code === tab || code === space) {
      effects.enter('linePrefix')
      effects.consume(code)
      return prefixContinuation
    }

    return prefixed
  }

  function prefixContinuation(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return prefixContinuation
    }

    effects.exit('linePrefix')
    return prefixed
  }

  function afterPrefixedConstruct(code) {
    // Make sure we eat EOFs.
    if (code !== code) {
      effects.consume(code)
      return afterPrefixedConstruct
    }

    /* istanbul ignore if - todo */
    if (code !== lineFeed) {
      throw new Error('Expected a line feed or EOF after block')
    }

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
      if (code === lineFeed || code !== code) {
        return ok(code)
      }

      effects.enter('paragraph')
      return data(code)
    }

    function data(code) {
      // code === lineFeed ||
      if (code !== code) {
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

    return [].concat(
      events.slice(0, 1),
      tokenizer(events[0][2].slice(content)),
      tokenizer(null),
      events.slice(-1)
    )
  }
}
