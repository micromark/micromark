'use strict'

module.exports = plainText

var characterEscape = require('./tokenize/text/character-escape')
var characterReference = require('./tokenize/text/character-reference')

var own = {}.hasOwnProperty

function plainText(effects) {
  var hooks = {
    plainTextStart: {},
    plainTextInitial: {},
    plainText: {
      38: characterReference, // '&'
      92: characterEscape // '\\'
    }
  }

  var plainText = effects.createHookableState(hooks.plainText, notPlainText)
  var plainTextInitial = effects.createHookableState(
    hooks.plainTextInitial,
    plainText
  )
  var plainTextStart = effects.createHookableState(
    hooks.plainTextStart,
    plainTextInitial
  )

  return plainTextStart

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
    if (own.call(hooks.plainText, code) || code !== code) {
      effects.exit('data')
      return plainText
    }

    // Data.
    effects.consume(code)
    return plainTextData
  }
}
