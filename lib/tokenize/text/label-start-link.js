exports.tokenize = tokenizeLabelStartLink

var codes = require('../../character/codes')

function tokenizeLabelStartLink(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.leftSquareBracket) return nok(code)

    var token = effects.enter('potentialLabelStartLink')
    token.active = true
    effects.consume(code)
    effects.exit('potentialLabelStartLink')
    return ok
  }
}
