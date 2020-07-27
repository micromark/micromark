exports.tokenize = tokenizeCharacterReference

var assert = require('assert')
var decode = require('parse-entities/decode-entity')
var asciiAlphanumeric = require('../../character/ascii-alphanumeric')
var asciiDigit = require('../../character/ascii-digit')
var asciiHexDigit = require('../../character/ascii-hex-digit')
var codes = require('../../character/codes')
var constants = require('../../constant/constants')
var fromCharCode = require('../../constant/from-char-code')
var types = require('../../constant/types')

function tokenizeCharacterReference(effects, ok, nok) {
  var buffer
  var size

  return start

  function start(code) {
    /* istanbul ignore next - Hooks. */
    if (code !== codes.ampersand) {
      return nok(code)
    }

    effects.enter(types.characterReference)
    effects.enter(types.characterReferenceMarker)
    effects.consume(code)
    effects.exit(types.characterReferenceMarker)
    return open
  }

  function open(code) {
    if (code === codes.numberSign) {
      effects.enter(types.characterReferenceMarkerNumeric)
      effects.consume(code)
      effects.exit(types.characterReferenceMarkerNumeric)
      return numericStart
    }

    if (asciiAlphanumeric(code)) {
      effects.enter(types.characterReferenceValue)
      buffer = ''
      return named(code)
    }

    return nok(code)
  }

  function numericStart(code) {
    if (code === codes.uppercaseX || code === codes.lowercaseX) {
      effects.enter(types.characterReferenceMarkerHexadecimal)
      effects.consume(code)
      effects.exit(types.characterReferenceMarkerHexadecimal)
      return hexadecimalStart
    }

    if (asciiDigit(code)) {
      effects.enter(types.characterReferenceValue)
      size = 0
      return decimal(code)
    }

    return nok(code)
  }

  function hexadecimalStart(code) {
    if (asciiHexDigit(code)) {
      effects.enter(types.characterReferenceValue)
      size = 0
      return hexadecimal(code)
    }

    return nok(code)
  }

  function named(code) {
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

  function hexadecimal(code) {
    if (code === codes.semicolon) {
      return end(code)
    }

    if (
      size < constants.characterReferenceHexadecimalSizeMax &&
      asciiHexDigit(code)
    ) {
      effects.consume(code)
      size++
      return hexadecimal
    }

    return nok(code)
  }

  function decimal(code) {
    if (code === codes.semicolon) {
      return end(code)
    }

    if (size < constants.characterReferenceDecimalSizeMax && asciiDigit(code)) {
      effects.consume(code)
      size++
      return decimal
    }

    return nok(code)
  }

  function end(code) {
    assert(code === codes.semicolon, 'expected semicolon')
    effects.exit(types.characterReferenceValue)
    effects.enter(types.characterReferenceMarker)
    effects.consume(code)
    effects.exit(types.characterReferenceMarker)
    effects.exit(types.characterReference)
    return ok
  }
}
