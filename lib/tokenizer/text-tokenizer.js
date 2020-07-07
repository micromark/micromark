'use strict'

module.exports = text

var characters = require('../util/characters')
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

var own = {}.hasOwnProperty

// To do: start and initial states in the future.
function text(effects) {
  var hooks = {}

  // Checking every space is probably too much.
  // Maybe catch this in block instead, or reverse parsing (also needed for GFM
  // emails?)
  // Alt idea: tokenize as `whitespace`, then on cr,lf,crlf make them into hard
  // breaks when preceded?
  hooks[characters.space] = hardBreakTrailing
  hooks[characters.exclamationMark] = labelStartImage
  hooks[characters.ampersand] = characterReference
  hooks[characters.asterisk] = emphasis
  hooks[characters.lessThan] = [autolink, html]
  hooks[characters.leftSquareBracket] = labelStartLink
  hooks[characters.backslash] = [hardBreakEscape, characterEscape]
  hooks[characters.rightSquareBracket] = labelEnd
  hooks[characters.underscore] = emphasis
  hooks[characters.graveAccent] = code

  var text = effects.createConstructsAttempt(hooks, after, dataStart)

  return text

  function after(code) {
    // Make sure we eat EOFs.
    if (code === characters.eof) {
      effects.consume(code)
      return after
    }

    // Otherwise, try the hooks again.
    return text(code)
  }

  function dataStart(code) {
    effects.enter('data')
    effects.consume(code)
    return data
  }

  function data(code) {
    // Markup or EOF.
    if (own.call(hooks, code) || code === characters.eof) {
      effects.exit('data')
      return text
    }

    // Data.
    effects.consume(code)
    return data
  }
}
