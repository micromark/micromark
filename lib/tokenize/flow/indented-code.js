exports.tokenize = tokenizeIndentedCode
exports.resolve = resolveIndentedCode

var assert = require('assert')
var codes = require('../../character/codes')
var markdownLineEnding = require('../../character/markdown-line-ending')
var markdownEnding = require('../../character/markdown-ending')
var markdownSpace = require('../../character/markdown-space')
var constants = require('../../constant/constants')

function resolveIndentedCode(events) {
  var head = events[0]
  var tailIndex = events.length - 1
  var tailToken
  var code

  while (tailIndex !== 0) {
    tailToken = events[tailIndex][1]

    if (tailToken.type !== 'lineEnding' && tailToken.type !== 'linePrefix') {
      break
    }

    if (tailToken.type === 'lineEnding') {
      tailToken.blankEnding = true
    }

    tailIndex--
  }

  if (events[tailIndex + 1] && events[tailIndex + 1][1].type === 'lineEnding') {
    events[tailIndex + 1][1].blankEnding = undefined
  }

  code = {
    type: 'indentedCode',
    start: head[1].start,
    end: tailToken.end
  }

  return [].concat(
    [['enter', code, head[2]]],
    events.slice(0, tailIndex + 1),
    [['exit', code, head[2]]],
    events.slice(tailIndex + 1)
  )
}

function tokenizeIndentedCode(effects, ok, nok) {
  var valid = false
  var size

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (!markdownSpace(code)) {
      return nok(code)
    }

    return lineStart(code)
  }

  function lineStart(code) {
    if (markdownSpace(code)) {
      size = 0
      effects.enter('linePrefix')
      return linePrefix(code)
    }

    if (markdownEnding(code)) {
      return lineEnd(code)
    }

    return end(code)
  }

  function linePrefix(code) {
    var prefix = size < constants.tabSize

    // Not enough indent yet.
    if (prefix === true && markdownSpace(code)) {
      size++
      effects.consume(code)
      return linePrefix
    }

    effects.exit('linePrefix')
    size = undefined

    if (markdownEnding(code)) {
      return lineEnd(code)
    }

    if (prefix === true) {
      return end(code)
    }

    effects.enter('codeLineData')
    return content(code)
  }

  function content(code) {
    if (markdownEnding(code)) {
      effects.exit('codeLineData')
      return lineEnd(code)
    }

    // Mark as valid if this is a non-whitespace.
    if (valid === false && !markdownSpace(code)) {
      valid = true
    }

    effects.consume(code)
    return content
  }

  function lineEnd(code) {
    if (valid === false || code === codes.eof) {
      return end(code)
    }

    assert(
      markdownLineEnding(code),
      'expected only an EOF or EOL for this state'
    )

    effects.enter('lineEnding')
    effects.consume(code)
    effects.exit('lineEnding')
    return lineStart
  }

  function end(code) {
    return (valid === true ? ok : nok)(code)
  }
}
