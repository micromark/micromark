'use strict'

module.exports = text

var codes = require('../character/codes')
var own = require('../constant/has-own-property')
var autolink = require('../tokenize/text/autolink')
var characterEscape = require('../tokenize/text/character-escape')
var characterReference = require('../tokenize/text/character-reference')
var code = require('../tokenize/text/code')
var emphasis = require('../tokenize/text/emphasis')
var hardBreakEscape = require('../tokenize/text/hard-break-escape')
var whitespace = require('../tokenize/text/whitespace')
var html = require('../tokenize/text/html')
var labelStartImage = require('../tokenize/text/label-start-image')
var labelStartLink = require('../tokenize/text/label-start-link')
var labelEnd = require('../tokenize/text/label-end')

// To do: start and initial states in the future.
function text(effects) {
  var hooks = {}

  // Checking every space is probably too much.
  // Maybe catch this in block instead, or reverse parsing (also needed for GFM
  // emails?)
  // Alt idea: tokenize as `whitespace`, then on cr,lf,crlf make them into hard
  // breaks when preceded?
  hooks[codes.cr] = whitespace
  hooks[codes.lf] = whitespace
  hooks[codes.crlf] = whitespace
  hooks[codes.ht] = whitespace
  hooks[codes.space] = whitespace
  hooks[codes.exclamationMark] = labelStartImage
  hooks[codes.ampersand] = characterReference
  hooks[codes.asterisk] = emphasis
  hooks[codes.lessThan] = [autolink, html]
  hooks[codes.leftSquareBracket] = labelStartLink
  hooks[codes.backslash] = [hardBreakEscape, characterEscape]
  hooks[codes.rightSquareBracket] = labelEnd
  hooks[codes.underscore] = emphasis
  hooks[codes.graveAccent] = code

  var text = effects.createConstructsAttempt(hooks, after, dataStart)

  return text

  function after(code) {
    // Make sure we eat EOFs.
    if (code === codes.eof) {
      effects.consume(code)
      return
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
    if (own.call(hooks, code) || code === codes.eof) {
      effects.exit('data')
      return text
    }

    // Data.
    effects.consume(code)
    return data
  }
}
