'use strict'

module.exports = plainText

var characterEscape = require('./tokenize/text/character-escape')
var characterReference = require('./tokenize/text/character-reference')

var own = {}.hasOwnProperty

// To do: start and initial states in the future.
function plainText(effects) {
  var hooks = {
    38: characterReference, // '&'
    92: characterEscape // '\\'
  }

  var plainText = effects.createHookableState(hooks, notPlainText)

  return plainText

  function notPlainText(code) {
    // Data.
    if (code === code) {
      effects.enter('data')
      effects.consume(code)
      return plainTextData
    }

    // EOF.
    effects.consume(code)
    return plainText
  }

  function plainTextData(code) {
    // Markup or EOF.
    if (own.call(hooks, code) || code !== code) {
      effects.exit('data')
      return plainText
    }

    // Data.
    effects.consume(code)
    return plainTextData
  }
}
