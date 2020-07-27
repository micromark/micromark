exports.tokenize = tokenizelabelLink
exports.resolveAll = require('./label-end').resolveAll

var codes = require('../character/codes')
var types = require('../constant/types')

function tokenizelabelLink(effects, ok, nok) {
  return start

  function start(code) {
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
