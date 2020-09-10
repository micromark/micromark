import type { Effects, NotOkay, Okay } from '../types'
import * as assert from 'assert'
// @ts-ignore
import decode from 'parse-entities/decode-entity'
import asciiAlphanumeric from '../character/ascii-alphanumeric'
import asciiDigit from '../character/ascii-digit'
import asciiHexDigit from '../character/ascii-hex-digit'
import * as codes from '../character/codes'
import * as constants from '../constant/constants'
import fromCharCode from '../constant/from-char-code'
import * as types from '../constant/types'

export const tokenize = function tokenizeCharacterReference(effects: Effects, ok: Okay, nok: NotOkay) {
  var buffer = ''
  var size = 0

  return start

  function start(code: number) {
    // istanbul ignore next - Hooks.
    if (code !== codes.ampersand) {
      return nok(code)
    }

    effects.enter(types.characterReference)
    effects.enter(types.characterReferenceMarker)
    effects.consume(code)
    effects.exit(types.characterReferenceMarker)
    return open
  }

  function open(code: number) {
    if (code === codes.numberSign) {
      effects.enter(types.characterReferenceMarkerNumeric)
      effects.consume(code)
      effects.exit(types.characterReferenceMarkerNumeric)
      return numericStart
    }

    if (asciiAlphanumeric(code)) {
      effects.enter(types.characterReferenceValue)
      return named(code)
    }

    return nok(code)
  }

  function numericStart(code: number) {
    if (code === codes.uppercaseX || code === codes.lowercaseX) {
      effects.enter(types.characterReferenceMarkerHexadecimal)
      effects.consume(code)
      effects.exit(types.characterReferenceMarkerHexadecimal)
      return hexadecimalStart
    }

    if (asciiDigit(code)) {
      effects.enter(types.characterReferenceValue)
      return decimal(code)
    }

    return nok(code)
  }

  function hexadecimalStart(code: number) {
    if (asciiHexDigit(code)) {
      effects.enter(types.characterReferenceValue)
      return hexadecimal(code)
    }

    return nok(code)
  }

  function named(code: number) {
    if (code === codes.semicolon && decode(buffer)) {
      return end(code)
    }

    if (
      buffer.length < constants.characterReferenceNamedSizeMax &&
      asciiAlphanumeric(code)
    ) {
      effects.consume(code)
      buffer += fromCharCode(code)
      return named
    }

    return nok(code)
  }

  function hexadecimal(code: number) {
    if (code === codes.semicolon) {
      return end(code)
    }

    if (
      size++ < constants.characterReferenceHexadecimalSizeMax &&
      asciiHexDigit(code)
    ) {
      effects.consume(code)
      return hexadecimal
    }

    return nok(code)
  }

  function decimal(code: number) {
    if (code === codes.semicolon) {
      return end(code)
    }

    if (
      size++ < constants.characterReferenceDecimalSizeMax &&
      asciiDigit(code)
    ) {
      effects.consume(code)
      return decimal
    }

    return nok(code)
  }

  function end(code: number) {
    assert.equal(code, codes.semicolon, 'expected semicolon')
    effects.exit(types.characterReferenceValue)
    effects.enter(types.characterReferenceMarker)
    effects.consume(code)
    effects.exit(types.characterReferenceMarker)
    effects.exit(types.characterReference)
    return ok
  }
}
