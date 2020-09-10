exports.tokenize = tokenizeCharacterReference

import assert from 'assert'
import decode from 'parse-entities/decode-entity'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiAlphanumeric'.
import asciiAlphanumeric from '../character/ascii-alphanumeric'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiDigit'.
import asciiDigit from '../character/ascii-digit'
// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'asciiHexDigit'.
import asciiHexDigit from '../character/ascii-hex-digit'
import codes from '../character/codes'
import constants from '../constant/constants'
import fromCharCode from '../constant/from-char-code'
import types from '../constant/types'

function tokenizeCharacterReference(effects: any, ok: any, nok: any) {
  var buffer = ''
  var size = 0

  return start

  function start(code: any) {
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

  function open(code: any) {
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

  function numericStart(code: any) {
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

  function hexadecimalStart(code: any) {
    if (asciiHexDigit(code)) {
      effects.enter(types.characterReferenceValue)
      return hexadecimal(code)
    }

    return nok(code)
  }

  function named(code: any) {
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

  function hexadecimal(code: any) {
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

  function decimal(code: any) {
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

  function end(code: any) {
    assert.equal(code, codes.semicolon, 'expected semicolon')
    effects.exit(types.characterReferenceValue)
    effects.enter(types.characterReferenceMarker)
    effects.consume(code)
    effects.exit(types.characterReferenceMarker)
    effects.exit(types.characterReference)
    return ok
  }
}
