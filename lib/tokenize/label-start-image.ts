exports.tokenize = tokenizelabelImage
exports.resolveAll = require('./label-end').resolveAll

import codes from '../character/codes'
import types from '../constant/types'

function tokenizelabelImage(effects: any, ok: any, nok: any) {
  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (code !== codes.exclamationMark) {
      return nok(code)
    }

    effects.enter(types.labelImage)
    effects.enter(types.labelImageMarker)
    effects.consume(code)
    effects.exit(types.labelImageMarker)
    return open
  }

  function open(code: any) {
    if (code === codes.leftSquareBracket) {
      effects.enter(types.labelMarker)
      effects.consume(code)
      effects.exit(types.labelMarker)
      effects.exit(types.labelImage)
      return ok
    }

    return nok(code)
  }
}
