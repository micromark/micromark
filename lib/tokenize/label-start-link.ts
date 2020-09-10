import type {Effects, NotOkay, Okay} from '../types'
import * as codes from '../character/codes'
import * as types from '../constant/types'

export const tokenize = function tokenizelabelLink(
  effects: Effects,
  ok: Okay,
  nok: NotOkay
) {
  return start

  function start(code: number) {
    // istanbul ignore next - Hooks.
    if (code !== codes.leftSquareBracket) {
      return nok(code)
    }

    effects.enter(types.labelLink)
    effects.enter(types.labelMarker)
    effects.consume(code)
    effects.exit(types.labelMarker)
    effects.exit(types.labelLink)
    return ok
  }
}

export {resolveAll} from './label-end'
