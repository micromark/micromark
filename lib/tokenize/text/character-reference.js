exports.tokenize = tokenizeCharacterReference

var decode = require('parse-entities/decode-entity')
var codes = require('../../character/codes')
var constants = require('../../constant/constants')
var fromCharCode = require('../../constant/from-char-code')
var asciiAlphanumeric = require('../../character/ascii-alphanumeric')
var asciiDigit = require('../../character/ascii-digit')
var asciiHexDigit = require('../../character/ascii-hex-digit')

function tokenizeCharacterReference(effects, ok, nok) {
  var buffer = ''
  var token

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== codes.ampersand) return nok(code)

    token = effects.enter('characterReferenceSequence')
    effects.enter('characterReferenceStartMarker')
    effects.consume(code)
    effects.exit('characterReferenceStartMarker')
    return open
  }

  function open(code) {
    if (code === codes.numberSign) {
      effects.enter('characterReferenceNumericMarker')
      effects.consume(code)
      effects.exit('characterReferenceNumericMarker')
      return numericStart
    }

    if (asciiAlphanumeric(code)) {
      effects.enter('characterReferenceNameValue')
      buffer += fromCharCode(code)
      effects.consume(code)
      return named
    }

    return nok(code)
  }

  function numericStart(code) {
    if (code === codes.uppercaseX || code === codes.lowercaseX) {
      effects.enter('characterReferenceHexadecimalMarker')
      effects.consume(code)
      effects.exit('characterReferenceHexadecimalMarker')
      return hexadecimalStart
    }

    if (asciiDigit(code)) {
      effects.enter('characterReferenceDecimalValue')
      buffer += fromCharCode(code)
      effects.consume(code)
      return decimal
    }

    return nok(code)
  }

  function hexadecimalStart(code) {
    if (asciiHexDigit(code)) {
      effects.enter('characterReferenceHexadecimalValue')
      buffer += fromCharCode(code)
      effects.consume(code)
      return hexadecimal
    }

    return nok(code)
  }

  function named(code) {
    if (code === codes.semicolon) {
      if (decode(buffer) !== false) {
        token.value = decode(buffer)
        effects.exit('characterReferenceNameValue')
        return end
      }

      return nok(code)
    }

    if (buffer.length === constants.maxCharacterReferenceNamedSize) {
      return nok(code)
    }

    if (asciiAlphanumeric(code)) {
      buffer += fromCharCode(code)
      effects.consume(code)
      return named
    }

    return nok(code)
  }

  function hexadecimal(code) {
    if (code === codes.semicolon) {
      token.value = parseNumber(buffer, constants.numericBaseHexadecimal)
      effects.exit('characterReferenceHexadecimalValue')
      return end
    }

    if (buffer.length === constants.maxCharacterReferenceHexadecimalSize) {
      return nok(code)
    }

    if (asciiHexDigit(code)) {
      buffer += fromCharCode(code)
      effects.consume(code)
      return hexadecimal
    }

    return nok(code)
  }

  function decimal(code) {
    if (code === codes.semicolon) {
      token.value = parseNumber(buffer, constants.numericBaseDecimal)
      effects.exit('characterReferenceDecimalValue')
      return end
    }

    if (buffer.length === constants.maxCharacterReferenceDecimalSize) {
      return nok(code)
    }

    if (asciiDigit(code)) {
      buffer += fromCharCode(code)
      effects.consume(code)
      return decimal
    }

    return nok(code)
  }

  function end(code) {
    /* istanbul ignore if - currently only used if we’re on a semicolon. */
    if (code !== codes.semicolon) {
      return nok(code)
    }

    effects.enter('characterReferenceEndMarker')
    effects.consume(code)
    effects.exit('characterReferenceEndMarker')
    effects.exit('characterReferenceSequence')
    return ok(code)
  }
}

function parseNumber(value, base) {
  return fromCharCode(parseInt(value, base) || codes.replacementCharacter)
}
