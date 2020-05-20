exports.tokenize = tokenizeLabelStartImage

var exclamationMark = 33 // '!'
var leftSquareBracket = 91 // '['

function tokenizeLabelStartImage(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== exclamationMark) return nok(code)

    effects.enter('potentialLabelStartImage')
    effects.consume(code)

    return open
  }

  function open(code) {
    if (code === leftSquareBracket) {
      effects.consume(code)
      effects.exit('potentialLabelStartImage')
      return ok(code)
    }

    return nok(code)
  }
}
