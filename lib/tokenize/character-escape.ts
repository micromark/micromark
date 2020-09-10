import type { Effects, NotOkay, Okay } from '../types'
import * as codes from '../character/codes'
import asciiPunctuation from '../character/ascii-punctuation'
import * as types from '../constant/types'

export const tokenize = function tokenizeCharacterEscape(effects: Effects, ok: Okay, nok: NotOkay) {
  return start

  function start(code: number) {
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

  function open(code: number) {
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
