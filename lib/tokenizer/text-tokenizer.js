'use strict'

module.exports = text

var autolink = require('../tokenize/text/autolink')
var characterEscape = require('../tokenize/text/character-escape')
var characterReference = require('../tokenize/text/character-reference')
var code = require('../tokenize/text/code')
var emphasis = require('../tokenize/text/emphasis')
var hardBreakEscape = require('../tokenize/text/hard-break-escape')
var hardBreakTrailing = require('../tokenize/text/hard-break-trailing')
var html = require('../tokenize/text/html')
var labelStartImage = require('../tokenize/text/label-start-image')
var labelStartLink = require('../tokenize/text/label-start-link')
var labelEnd = require('../tokenize/text/label-end')
var labelResource = require('../tokenize/text/label-resource')

var space = 32 // ' '
var exclamationMark = 33 // '!'
var ampersand = 38 // '&'
var leftParenthesis = 40 // '('
var asterisk = 42 // '*'
var lessThan = 60 // '<'
var leftSquareBracket = 91 // '['
var backslash = 92 // '\'
var rightSquareBracket = 93 // ']'
var underscore = 95 // '_'
var graveAccent = 96 // '`'

var own = {}.hasOwnProperty

function text(effects) {
  var hooks = {textStart: {}, textInitial: {}, text: {}}

  hooks.text[space] = hardBreakTrailing // This one should be caught in block.
  hooks.text[exclamationMark] = labelStartImage
  hooks.text[ampersand] = characterReference
  hooks.text[leftParenthesis] = labelResource
  hooks.text[asterisk] = emphasis
  hooks.text[lessThan] = [autolink, html]
  hooks.text[leftSquareBracket] = labelStartLink
  hooks.text[backslash] = [hardBreakEscape, characterEscape]
  hooks.text[rightSquareBracket] = labelEnd
  hooks.text[underscore] = emphasis
  hooks.text[graveAccent] = code

  var text = effects.createHookableState(hooks.text, notText)
  var textInitial = effects.createHookableState(hooks.textInitial, text)
  var textStart = effects.createHookableState(hooks.textStart, textInitial)

  return textStart

  function notText(code) {
    // Data.
    if (code === code) {
      effects.enter('data')
      effects.consume(code)
      return textData
    }

    // EOF.
    effects.consume(code)
    return text
  }

  function textData(code) {
    // Markup or EOF.
    if (own.call(hooks.text, code) || code !== code) {
      effects.exit('data')
      return text
    }

    // Data.
    effects.consume(code)
    return textData
  }
}
