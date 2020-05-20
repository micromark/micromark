exports.tokenize = tokenizeHardBreakEscape

var backslash = 92 // '\'
var lineFeed = 10 // '\n'

function tokenizeHardBreakEscape(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== backslash) return nok(code)

    effects.enter('hardBreakEscape')
    effects.consume(code)

    return open
  }

  function open(code) {
    if (code === lineFeed) {
      effects.exit('hardBreakEscape')
      return ok(code)
    }

    return nok(code)
  }
}
