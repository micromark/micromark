module.exports = text

var codes = require('../character/codes')
var own = require('../constant/has-own-property')
var types = require('../constant/types')

// To do: start and initial states in the future.
function text(effects) {
  var hooks = this.parser.hooks.text
  var text = effects.createConstructsAttempt(hooks, after, dataStart)

  return text

  function after(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
    }

    // Otherwise, try the hooks again.
    return text(code)
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
      return text
    }

    // Data.
    effects.consume(code)
    return data
  }
}
