exports.tokenize = tokenizeCharacterEscape

import codes from '../character/codes'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiPunctuation'.
import asciiPunctuation from '../character/ascii-punctuation'
import types from '../constant/types'

function tokenizeCharacterEscape(effects: any, ok: any, nok: any) {
  return start

  function start(code: any) {
    // istanbul ignore next - Hooks.
    if (code !== codes.backslash) {
      return nok(code)
    }

    effects.enter(types.characterEscape)
    effects.enter(types.escapeMarker)
    effects.consume(code)
    effects.exit(types.escapeMarker)
    return open
  }

  function open(code: any) {
    if (asciiPunctuation(code)) {
      effects.enter(types.characterEscapeValue)
      effects.consume(code)
      effects.exit(types.characterEscapeValue)
      effects.exit(types.characterEscape)
      return ok
    }

    return nok(code)
  }
}
