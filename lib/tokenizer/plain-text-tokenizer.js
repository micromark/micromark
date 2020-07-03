'use strict'

module.exports = plainText

var characters = require('../util/characters')
var characterEscape = require('../tokenize/text/character-escape')
var characterReference = require('../tokenize/text/character-reference')

var own = {}.hasOwnProperty

// To do: start and initial states in the future.
function plainText(effects) {
  var hooks = {}

  hooks[characters.ampersand] = characterReference
  hooks[characters.backslash] = characterEscape

  var plainText = effects.createConstructsAttempt(hooks, after, dataStart)

  return plainText

  function after(code) {
    // Make sure we eat EOFs.
    if (code === characters.eof) {
      effects.consume(code)
      return after
    }

    // Otherwise, try the hooks again.
    return plainText(code)
  }

  function dataStart(code) {
    effects.enter('data')
    effects.consume(code)
    return data
  }

  function data(code) {
    // Markup or EOF.
    if (own.call(hooks, code) || code === characters.eof) {
      effects.exit('data')
      return plainText
    }

    // Data.
    effects.consume(code)
    return data
  }
}
