var characterEntities = require('character-entities')
var asciiAlphanumeric = require('../../character/group/ascii-alphanumeric')
var asciiDigit = require('../../character/group/ascii-digit')
var asciiHexDigit = require('../../character/group/ascii-hex-digit')

exports.tokenize = tokenizeCharacterReference

var own = {}.hasOwnProperty
var fromCharCode = String.fromCharCode

var numberSign = 35 // '#'
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
  var token = effects.enter('characterReferenceSequence')
  var buffer = ''

  effects.enter('characterReferenceStartMarker')
  effects.consume()
  effects.exit('characterReferenceStartMarker')

  return start

  function start(code) {
    if (code === numberSign) {
      effects.enter('characterReferenceNumericMarker')
      effects.consume()
      effects.exit('characterReferenceNumericMarker')
      return numericStart
    }

    if (asciiAlphanumeric(code)) {
      effects.enter('characterReferenceNameValue')
      buffer += fromCharCode(code)
      effects.consume()
      return named
    }

    return nok
  }

  function numericStart(code) {
    if (code === uppercaseX || code === lowercaseX) {
      effects.enter('characterReferenceHexadecimalMarker')
      effects.consume()
      effects.exit('characterReferenceHexadecimalMarker')
      return hexadecimalStart
    }

    if (asciiDigit(code)) {
      effects.enter('characterReferenceDecimalValue')
      buffer += fromCharCode(code)
      effects.consume()
      return decimal
    }

    return nok
  }

  function hexadecimalStart(code) {
    if (asciiHexDigit(code)) {
      effects.enter('characterReferenceHexadecimalValue')
      buffer += fromCharCode(code)
      effects.consume()
      return hexadecimal
    }

    return nok
  }

  function named(code) {
    if (code === semicolon) {
      if (own.call(characterEntities, buffer)) {
        token.value = characterEntities[buffer]
        effects.exit('characterReferenceNameValue')
        return end
      }

      return nok
    }

    if (buffer.length === maxNamedSize) {
      return nok
    }

    if (asciiAlphanumeric(code)) {
      buffer += fromCharCode(code)
      effects.consume()
      return named
    }

    return nok
  }

  function hexadecimal(code) {
    if (code === semicolon) {
      token.value = parseNumber(buffer, baseHexadecimal)
      effects.exit('characterReferenceHexadecimalValue')
      return end
    }

    if (buffer.length === maxHexadecimalSize) {
      return nok
    }

    if (asciiHexDigit(code)) {
      buffer += fromCharCode(code)
      effects.consume()
      return hexadecimal
    }

    return nok
  }

  function decimal(code) {
    if (code === semicolon) {
      token.value = parseNumber(buffer, baseDecimal)
      effects.exit('characterReferenceDecimalValue')
      return end
    }

    if (buffer.length === maxDecimalSize) {
      return nok
    }

    if (asciiDigit(code)) {
      buffer += fromCharCode(code)
      effects.consume()
      return decimal
    }

    return nok
  }

  function end(code) {
    /* istanbul ignore if - currently only used if we’re on a semicolon. */
    if (code !== semicolon) {
      return nok
    }

    effects.enter('characterReferenceEndMarker')
    effects.consume()
    effects.exit('characterReferenceEndMarker')
    effects.exit('characterReferenceSequence')
    return ok
  }
}

function parseNumber(value, base) {
  return fromCharCode(parseInt(value, base) || replacementCharacter)
}
