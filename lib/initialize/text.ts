import type { Effects, Parser } from '../types'
import * as codes from '../character/codes'
import own from '../constant/has-own-property'
import * as types from '../constant/types'

function initializeFactory(field: string) {
  return {tokenize: initializeText}

  function initializeText(this: {parser: Parser}, effects: Effects) {
    var hooks = this.parser.hooks[field]
    var text = effects.attempt(hooks, after, dataStart)

    return text

    function after(code: number) {
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

export const text = initializeFactory('text')
export const string = initializeFactory('string')