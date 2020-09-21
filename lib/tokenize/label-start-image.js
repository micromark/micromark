exports.tokenize = tokenizelabelImage
exports.resolveAll = require('./label-end').resolveAll

var codes = require('../character/codes')
var types = require('../constant/types')

function tokenizelabelImage(effects, ok, nok) {
  var self = this

  return start

  function start(code) {
    // istanbul ignore next - Hooks.
    if (code !== codes.exclamationMark) {
      return nok(code)
    }

    effects.enter(types.labelImage)
    effects.enter(types.labelImageMarker)
    effects.consume(code)
    effects.exit(types.labelImageMarker)
    return open
  }

  function open(code) {
    if (code === codes.leftSquareBracket) {
      effects.enter(types.labelMarker)
      effects.consume(code)
      effects.exit(types.labelMarker)
      effects.exit(types.labelImage)
      return after
    }

    return nok(code)
  }

  function after(code) {
    /* istanbul ignore next - the footnote plugin turns of images when they
     * start with a caret. */
    if (
      '_hiddenFootnoteSupport' in self.parser.constructs &&
      code === codes.caret
    ) {
      return nok(code)
    }

    return ok(code)
  }
}
