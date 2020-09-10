exports.tokenize = tokenizelabelLink
exports.resolveAll = require('./label-end').resolveAll

import codes from '../character/codes'
import types from '../constant/types'

function tokenizelabelLink(effects: any, ok: any, nok: any) {
  return start

  function start(code: any) {
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
