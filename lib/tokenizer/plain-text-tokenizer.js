module.exports = plainText

var codes = require('../character/codes')
var own = require('../constant/has-own-property')
var types = require('../constant/types')
var characterEscape = require('../tokenize/text/character-escape')
var characterReference = require('../tokenize/text/character-reference')

// To do: start and initial states in the future.
function plainText(effects) {
  var hooks = {}

  hooks[codes.ampersand] = characterReference
  hooks[codes.backslash] = characterEscape

  var plainText = effects.createConstructsAttempt(hooks, after, dataStart)

  return plainText

  function after(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    // Otherwise, try the hooks again.
    return plainText(code)
  }

  function dataStart(code) {
    effects.enter(types.data)
    effects.consume(code)
    return data
  }

  function data(code) {
    // Markup or EOF.
    if (own.call(hooks, code) || code === codes.eof) {
      effects.exit(types.data)
      return plainText
    }

    // Data.
    effects.consume(code)
    return data
  }
}
