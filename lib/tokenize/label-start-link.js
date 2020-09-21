exports.tokenize = tokenizelabelLink
exports.resolveAll = require('./label-end').resolveAll

var codes = require('../character/codes')
var types = require('../constant/types')

function tokenizelabelLink(effects, ok, nok) {
  var self = this

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
    return after
  }

  function after(code) {
    /* istanbul ignore next - the footnote plugin turns of links when they start
     * with a caret. */
    if (
      '_hiddenFootnoteSupport' in self.parser.constructs &&
      code === codes.caret
    ) {
      return nok(code)
    }

    return ok(code)
  }
}
