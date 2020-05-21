exports.tokenize = tokenizeAtxHeading

var numberSign = 35 // '#'

function tokenizeAtxHeading(effects, ok, nok) {
  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== numberSign) return nok(code)

    console.log('atx heading!!!', code)
    return nok(code)
  }
}
