'use strict'

module.exports = micromark

var assert = require('assert')
var autolink = require('./tokenize/text/autolink')
var characterEscape = require('./tokenize/text/character-escape')
var characterReference = require('./tokenize/text/character-reference')
var code = require('./tokenize/text/code')
var emphasis = require('./tokenize/text/emphasis')
var hardBreakEscape = require('./tokenize/text/hard-break-escape')
var hardBreakTrailing = require('./tokenize/text/hard-break-trailing')
var html = require('./tokenize/text/html')
var labelStartImage = require('./tokenize/text/label-start-image')
var labelStartLink = require('./tokenize/text/label-start-link')
var labelEnd = require('./tokenize/text/label-end')
var labelResource = require('./tokenize/text/label-resource')

// Included now, here, to check bundle size.
var htmlBlockNames = require('./util/html-block-names')
/* eslint-disable-next-line no-use-extend-native/no-use-extend-native */
Function.prototype(htmlBlockNames)

var eof = NaN
var lineFeed = 10 // '\n'
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
var assign = Object.assign

var allHooks = {
  textStart: {},
  textInitial: {},
  text: {},
  plainTextStart: {},
  plainTextInitial: {},
  plainText: {}
}

allHooks.text[space] = hardBreakTrailing // This one should be caught in block.
allHooks.text[exclamationMark] = labelStartImage
allHooks.text[ampersand] = characterReference
allHooks.text[leftParenthesis] = labelResource
allHooks.text[asterisk] = emphasis
allHooks.text[lessThan] = [autolink, html]
allHooks.text[leftSquareBracket] = labelStartLink
allHooks.text[backslash] = [hardBreakEscape, characterEscape]
allHooks.text[rightSquareBracket] = labelEnd
allHooks.text[underscore] = emphasis
allHooks.text[graveAccent] = code

function micromark(type, from) {
  var buffer = ''
  var index = 0
  var place = assign({}, from || {line: 1, column: 1, offset: index}, {
    index: index
  })

  // Hookable states.
  var text = hookable(allHooks.text, notText)
  var textInitial = hookable(allHooks.textInitial, text)
  var textStart = hookable(allHooks.textStart, textInitial)

  var resolveAlls = Object.keys(allHooks.text)
    .flatMap((k) => allHooks.text[k])
    .map((h) => h.resolveAll)
    .filter(Boolean)
    .filter((d, i, a) => a.indexOf(d) === i)

  // Parser state.
  var state
  var stack = [] // Current open tokens.
  var eventQueue = []

  if (type === 'text') {
    state = textStart
  }

  if (state === undefined) {
    throw new Error('Unknown construct: `' + type + '`')
  }

  var helpers = {
    slice: slice
  }

  var effects = {
    previous: eof,
    previousToken: null,
    consume: consume,
    enter: enter,
    exit: exit
  }

  return write

  function write(value) {
    var done = value === null
    var queue
    var document

    if (done === false) {
      buffer += value
    }

    main(done)

    // To do: clear buffer.
    if (resolveAlls.length === 0) {
      queue = eventQueue
      eventQueue = []
      return queue
    }

    // If we needed to buffer events due to `resolveAll`s, and we’re not done,
    // return an empty events list.
    if (done === false) {
      return []
    }

    // Otherwise, resolve, and exit.
    document = {type: 'markdown'}

    resolveAlls.forEach((resolveAll) => {
      eventQueue = resolveAll(eventQueue, helpers)
    })

    return [].concat([['enter', document, helpers]], eventQueue, [
      ['exit', document, helpers]
    ])
  }

  //
  // Helpers.
  //

  function slice(token) {
    return buffer.slice(token.start.index, token.end.index)
  }

  //
  // State management.
  //

  // Main loop (note that `index` is modified by `consume`).
  function main(end) {
    // If `end`, we also feed an EOF.
    // Which is finally consumed by the last state.
    var offset = end ? 1 : 0

    while (index < buffer.length + offset) {
      state = state(buffer.charCodeAt(index))
    }
  }

  // Move a character forward.
  function consume(code) {
    assert.equal(typeof code, 'number', 'expected a numeric code')

    // Line ending; assumes CR is not used (that’s a to do).
    if (code === lineFeed) {
      place.line++
      place.column = 1
    }
    // Anything else.
    else {
      place.column++
    }

    index++

    place.offset++
    place.index = index

    effects.previous = code
  }

  // Start a token.
  function enter(type) {
    var token = {type: type, start: now()}

    console.group('enter:', type)

    eventQueue.push(['enter', token, helpers])

    stack.push(token)

    return token
  }

  // Stop a token.
  function exit(type) {
    var token

    assert.equal(
      stack[stack.length - 1].type,
      type,
      'expected exit token to match current token'
    )

    token = stack.pop()

    token.end = now()

    assert.notEqual(
      token.start.index,
      token.end.index,
      'expected non-empty token'
    )

    console.groupEnd()
    console.info('exit:', token.type)

    eventQueue.push(['exit', token, helpers])

    effects.previousToken = token

    return token
  }

  // Get the current point.
  function now() {
    return assign({}, place)
  }

  //
  // State machine.
  //

  function notText(code) {
    // Data.
    if (code === code) {
      enter('data')
      consume(code)
      return textData
    }

    // EOF.
    consume(code)
    return text
  }

  function textData(code) {
    // Markup or EOF.
    if (own.call(allHooks.text, code) || code !== code) {
      exit('data')
      return text
    }

    // Data.
    consume(code)
    return textData
  }

  function hookable(hooks, bogus) {
    return hooked

    function hooked(code) {
      if (own.call(hooks, code)) {
        return attempt(hooks[code], hooked, bogus)
      }

      return bogus
    }
  }

  function attempt(hooks, returnState, bogusState) {
    var multiple = 'length' in hooks
    var hookIndex = 0
    var startEventQueue = eventQueue
    var startPrevious = effects.previous
    var startPreviousToken = effects.previousToken
    var startIndex = index
    var startPlace = now()
    var startDepth = stack.length
    var hook = multiple ? hooks[hookIndex] : hooks

    eventQueue = []

    return hook.tokenize(effects, ok, nok)

    function ok() {
      // To do: resolve is horrible. Make it pretty.
      var resolve = hook.resolve || identity
      var resolveTo = hook.resolveTo || identity
      var tail

      eventQueue = resolveTo(
        startEventQueue.concat(resolve(eventQueue, helpers)),
        helpers
      )
      tail = eventQueue[eventQueue.length - 1]

      effects.previousToken = tail[1]
      assert.equal(tail[0], 'exit', 'expected end in exit')

      return returnState
    }

    function nok() {
      // Clear debugging.
      var n = 99
      while (n--) console.groupEnd()

      // Reset.
      index = startIndex
      place = assign({}, startPlace)
      stack = stack.slice(0, startDepth)
      effects.previous = startPrevious
      effects.previousToken = startPreviousToken

      // Next hook.
      if (multiple && ++hookIndex < hooks.length) {
        eventQueue = []
        hook = hooks[hookIndex]
        return hook.tokenize(effects, ok, nok)
      }

      eventQueue = startEventQueue
      return bogusState
    }
  }
}

function identity(x) {
  return x
}
