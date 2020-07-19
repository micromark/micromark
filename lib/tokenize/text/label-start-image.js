exports.tokenize = tokenizeLabelStartImage
exports.resolveAll = require('./label-end').resolveAll

var codes = require('../../character/codes')

function tokenizeLabelStartImage(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.exclamationMark) return nok(code)

    var token = effects.enter('potentialLabelStartImage')
    token.active = true
    effects.consume(code)

    return open
  }

  function open(code) {
    if (code === codes.leftSquareBracket) {
      effects.consume(code)
      effects.exit('potentialLabelStartImage')
      return ok
    }

    return nok(code)
  }
}
