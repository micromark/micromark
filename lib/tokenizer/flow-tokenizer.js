'use strict'

module.exports = flow

var atxHeading = require('../tokenize/flow/atx-heading')

var tab = 9 // '\t'
var space = 32 // ' '

var own = {}.hasOwnProperty

function flow(effects) {
  var hooks = {
    35: atxHeading // '$'
  }

  var initial = effects.createHookableState(hooks, paragraph)

  return prefixStart

  function prefixStart(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return prefixStart
    }

    return start
  }

  // To do: hooks for start state (YAML?).
  function start() {
    return initial
  }

  function paragraph(code) {
    // Data.
    if (code === code) {
      effects.enter('paragraph')
      effects.consume(code)
      return flowData
    }

    // EOF.
    effects.consume(code)
    return initial
  }

  function flowData(code) {
    // Markup or EOF.
    if (own.call(hooks, code) || code !== code) {
      effects.exit('paragraph')
      return initial
    }

    // Data.
    effects.consume(code)
    return flowData
  }
}
