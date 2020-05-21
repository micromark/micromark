'use strict'

module.exports = plainText

var characterEscape = require('../tokenize/text/character-escape')
var characterReference = require('../tokenize/text/character-reference')

var own = {}.hasOwnProperty

// To do: start and initial states in the future.
function plainText(effects) {
  var hooks = {
    38: characterReference, // '&'
    92: characterEscape // '\\'
  }

  var plainText = effects.createHookableState(hooks, {tokenize: plainTextData})

  return plainText

  function plainTextData(effects, ok) {
    var first = true
    effects.enter('data')

    return data

    function data(code) {
      // Markup or EOF.
      if (!first && (own.call(hooks, code) || code !== code)) {
        effects.exit('data')
        return ok(code)
      }

      // Data.
      effects.consume(code)
      first = false
      return data
    }
  }
}
