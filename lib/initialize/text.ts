exports.text = initializeFactory('text')
exports.string = initializeFactory('string')

import codes from '../character/codes'
import own from '../constant/has-own-property'
import types from '../constant/types'

function initializeFactory(field: any) {
  return {tokenize: initializeText}

  function initializeText(effects: any) {
    // @ts-expect-error ts-migrate(2683) FIXME: 'this' implicitly has type 'any' because it does n... Remove this comment to see the full error message
    var hooks = this.parser.hooks[field]
    var text = effects.attempt(hooks, after, dataStart)

    return text

    function after(code: any) {
      // Make sure we eat EOFs.
      if (code === codes.eof) {
        effects.consume(code)
        return
      }

      // Otherwise, try the hooks again.
      return text(code)
    }

    function dataStart(code: any) {
      // Make sure we eat EOFs.
      if (code === codes.eof) {
        effects.consume(code)
        return
      }

      effects.enter(types.data)
      effects.consume(code)
      return data
    }

    function data(code: any) {
      // Markup or EOF.
      if (code === codes.eof || own.call(hooks, code)) {
        effects.exit(types.data)
        return text(code)
      }

      // Data.
      effects.consume(code)
      return data
    }
  }
}
