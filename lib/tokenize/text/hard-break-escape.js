exports.tokenize = tokenizeHardBreakEscape

var characters = require('../../util/characters')

function tokenizeHardBreakEscape(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.backslash) return nok(code)

    effects.enter('hardBreakEscape')
    effects.consume(code)

    return open
  }

  function open(code) {
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      effects.exit('hardBreakEscape')
      return ok(code)
    }

    return nok(code)
  }
}
