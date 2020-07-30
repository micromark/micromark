module.exports = plainText

var codes = require('../character/codes')
var own = require('../constant/has-own-property')
var types = require('../constant/types')

// To do: start and initial states in the future.
function plainText(effects) {
  var hooks = this.parser.hooks.plainText
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
