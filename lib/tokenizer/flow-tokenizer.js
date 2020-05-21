'use strict'

module.exports = flow

var atxHeading = require('../tokenize/flow/atx-heading')
var thematicBreak = require('../tokenize/flow/thematic-break')
var core = require('../core')

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var space = 32 // ' '

function flow(effects) {
  var hooks = {
    35: atxHeading, // '#'
    42: thematicBreak, // '*'
    45: thematicBreak, // '-'
    95: thematicBreak // '_'
  }

  var content = {
    tokenize: tokenizeContent,
    resolve: resolveContent
  }

  var initial = effects.createHookableState(hooks, content, afterFlow)

  return prefixInitial

  function prefixInitial(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return prefixInitial
    }

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
    effects.enter('paragraph')

    return data

    function data(code) {
      // To do: exit in other cases.
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
