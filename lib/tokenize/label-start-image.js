import assert from 'assert'
import {labelEnd} from './label-end.js'
import {codes} from '../character/codes.js'
import {types} from '../constant/types.js'

export const labelStartImage = {
  name: 'labelStartImage',
  tokenize: tokenizeLabelStartImage,
  resolveAll: labelEnd.resolveAll
}

function tokenizeLabelStartImage(effects, ok, nok) {
  const self = this

  return start

  function start(code) {
    assert(code === codes.exclamationMark, 'expected `!`')
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
    /* c8 ignore next */
    return code === codes.caret &&
      /* c8 ignore next */
      '_hiddenFootnoteSupport' in self.parser.constructs
      ? /* c8 ignore next */ nok(code)
      : ok(code)
  }
}
