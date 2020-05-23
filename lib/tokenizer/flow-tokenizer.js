'use strict'

module.exports = flow

var atxHeading = require('../tokenize/flow/atx-heading')
var html = require('../tokenize/flow/html')
var thematicBreak = require('../tokenize/flow/thematic-break')
var core = require('../core')

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var space = 32 // ' '

function flow(effects) {
  var prefixedHooks = {
    35: atxHeading, // '#'
    42: thematicBreak, // '*'
    45: thematicBreak, // '-'
    60: html, // '<'
    95: thematicBreak // '_'
  }

  var content = {
    tokenize: tokenizeContent,
    resolve: resolveContent
  }

  var initial = effects.createHookableState(prefixedHooks, content, afterFlow)

  return prefixInitial

  function prefixInitial(code) {
    if (code === tab || code === space) {
      effects.enter('linePrefix')
      effects.consume(code)
      return prefixInitialContinuation
    }

    return initial
  }

  function prefixInitialContinuation(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return prefixInitialContinuation
    }

    effects.exit('linePrefix')
    return initial
  }

  function afterFlow(code) {
    // Make sure we eat EOFs.
    if (code !== code) {
      effects.consume(code)
      return afterFlow
    }

    /* istanbul ignore if - todo */
    if (code !== lineFeed) {
      throw new Error('Expected a line feed or EOF after block')
    }

    effects.enter('lineFeed')
    effects.consume(code)
    effects.exit('lineFeed')
    return prefixInitial
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
