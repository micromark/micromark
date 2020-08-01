exports.text = initializeFactory('text')
exports.string = initializeFactory('string')

var codes = require('../character/codes')
var own = require('../constant/has-own-property')
var types = require('../constant/types')

function initializeFactory(field) {
  return {tokenize: initializeText}

  function initializeText(effects) {
    var hooks = this.parser.hooks[field]
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
      // Make sure we eat EOFs.
      if (code === codes.eof) {
        effects.consume(code)
        return
      }

      effects.enter(types.data)
      effects.consume(code)
      return data
    }

    function data(code) {
      // Markup or EOF.
      if (own.call(hooks, code) || code === codes.eof) {
        effects.exit(types.data)
        return text(code)
      }

      // Data.
      effects.consume(code)
      return data
    }
  }
}
