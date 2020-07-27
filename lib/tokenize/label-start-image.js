exports.tokenize = tokenizelabelImage
exports.resolveAll = require('./label-end').resolveAll

var codes = require('../character/codes')
var types = require('../constant/types')

function tokenizelabelImage(effects, ok, nok) {
  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.exclamationMark) {
      return nok(code)
    }

    effects.enter(types.labelImage)
    effects.enter(types.labelMarkerImage)
    effects.consume(code)
    effects.exit(types.labelMarkerImage)
    return open
  }

  function open(code) {
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
