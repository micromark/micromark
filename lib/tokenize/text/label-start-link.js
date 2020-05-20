exports.tokenize = tokenizeLabelStartLink

var leftSquareBracket = 91 // '['

function tokenizeLabelStartLink(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== leftSquareBracket) return nok(code)

    effects.enter('potentialLabelStartLink')
    effects.consume(code)
    effects.exit('potentialLabelStartLink')

    return ok(code)
  }
}
