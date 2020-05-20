var decode = require('parse-entities/decode-entity')
var asciiAlphanumeric = require('../../character/group/ascii-alphanumeric')
var asciiDigit = require('../../character/group/ascii-digit')
var asciiHexDigit = require('../../character/group/ascii-hex-digit')

exports.tokenize = tokenizeCharacterReference

var fromCharCode = String.fromCharCode

var numberSign = 35 // '#'
var ampersand = 38 // '&'
var semicolon = 59 // ';'
var uppercaseX = 88 // 'X'
var lowercaseX = 120 // 'x'
var replacementCharacter = 0xfffd

var baseDecimal = 10
var baseHexadecimal = 0x10

var maxNamedSize = 31 // `&CounterClockwiseContourIntegral;`
var maxHexadecimalSize = 6 // `&#xff9999;`
var maxDecimalSize = 7 // `&#9999999;`

function tokenizeCharacterReference(effects, ok, nok) {
  var buffer = ''
  var token

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== ampersand) return nok(code)

    token = effects.enter('characterReferenceSequence')
    effects.enter('characterReferenceStartMarker')
    effects.consume(code)
    effects.exit('characterReferenceStartMarker')
    return open
  }

  function open(code) {
    if (code === numberSign) {
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
    if (code === uppercaseX || code === lowercaseX) {
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
    if (code === semicolon) {
      if (decode(buffer) !== false) {
        token.value = decode(buffer)
        effects.exit('characterReferenceNameValue')
        return end
      }

      return nok(code)
    }

    if (buffer.length === maxNamedSize) {
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
    if (code === semicolon) {
      token.value = parseNumber(buffer, baseHexadecimal)
      effects.exit('characterReferenceHexadecimalValue')
      return end
    }

    if (buffer.length === maxHexadecimalSize) {
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
    if (code === semicolon) {
      token.value = parseNumber(buffer, baseDecimal)
      effects.exit('characterReferenceDecimalValue')
      return end
    }

    if (buffer.length === maxDecimalSize) {
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
    if (code !== semicolon) {
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
  return fromCharCode(parseInt(value, base) || replacementCharacter)
}
