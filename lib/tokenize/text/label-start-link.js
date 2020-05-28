exports.tokenize = tokenizeLabelStartLink

var characters = require('../../util/characters')

function tokenizeLabelStartLink(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.leftSquareBracket) return nok(code)

    effects.enter('potentialLabelStartLink')
    effects.consume(code)
    effects.exit('potentialLabelStartLink')

    return ok(code)
  }
}
