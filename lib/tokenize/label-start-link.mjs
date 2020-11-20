import labelEnd from './label-end.mjs'

var labelStartLink = {
  tokenize: tokenizeLabelStartLink,
  resolveAll: labelEnd.resolveAll
}
export default labelStartLink

import assert from 'assert'
import * as codes from '../character/codes.mjs'
import * as types from '../constant/types.mjs'

function tokenizeLabelStartLink(effects, ok, nok) {
  var self = this

  return start

  function start(code) {
    assert(code === codes.leftSquareBracket, 'expected `[`')
    effects.enter(types.labelLink)
    effects.enter(types.labelMarker)
    effects.consume(code)
    effects.exit(types.labelMarker)
    effects.exit(types.labelLink)
    return after
  }

  function after(code) {
    /* istanbul ignore next - footnotes. */
    return code === codes.caret &&
      '_hiddenFootnoteSupport' in self.parser.constructs
      ? nok(code)
      : ok(code)
  }
}
