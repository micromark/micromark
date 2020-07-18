exports.tokenize = tokenizeHardBreakEscape

var codes = require('../../character/codes')

function tokenizeHardBreakEscape(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.backslash) return nok(code)

    effects.enter('hardBreakEscape')
    effects.consume(code)

    return open
  }

  function open(code) {
    if (code === codes.cr || code === codes.lf || code === codes.crlf) {
      effects.exit('hardBreakEscape')
      return ok(code)
    }

    return nok(code)
  }
}
