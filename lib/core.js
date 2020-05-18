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

var allHooks = {
  text: {}
}

allHooks.text[space] = hardBreakTrailing
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

function micromark(adapters) {
  var buffer = ''
  var index = 0
  var place = {line: 1, column: 1, offset: index, index: index}

  // Parser state.
  var state = textStart
  var stack = [] // Current open tokens.
  var eventQueue = []

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

  // Hookable states.
  var text = hookable(allHooks.text, notText)

  var head = false

  // Run the state machine.
  return write

  function write(value) {
    if (value) {
      head = true
      buffer += value
    }

    main(value !== value)

    if (value !== value) {
      if (head) emit('enter', {type: 'markdown'})
      console.log('evs:', eventQueue)
      emitAll(eventQueue, allHooks.text)
      assert.equal(stack.length, 0, 'expected no tokens on the stack')
      if (head) emit('exit', {type: 'markdown'})
    }
  }

  //
  // State management.
  //

  // Main loop (note that `index` is modified by `consume`).
  function main(end) {
    // If `end`, we also feed an EOF. Which is finally consumed by the last
    // state.
    var offset = end ? 1 : 0

    while (index < buffer.length + offset) {
      state = state(buffer.charCodeAt(index))
    }
  }

  // Get the current point.
  function now() {
    return Object.assign({}, place)
  }

  // Move a character forward.
  function consume(code) {
    assert.equal(typeof code, 'number', 'expected a numeric code')
    console.log('consume:', state.name, code)

    // Line ending; assumes CR is not used (remark removes those).
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

    eventQueue.push(['enter', token])

    stack.push(token)

    return token
  }

  // Stop a token.
  function exit(type) {
    assert.equal(
      stack[stack.length - 1].type,
      type,
      'expected exit token to match current token'
    )

    var token = stack.pop()

    token.end = now()

    assert.notEqual(
      token.start.index,
      token.end.index,
      'expected non-empty token'
    )

    console.groupEnd()
    console.info('exit:', token.type)

    eventQueue.push(['exit', token])

    effects.previousToken = token

    return token
  }

  // Emit a token.
  function emit(name, token) {
    var map = adapters[name]

    if (own.call(map, token.type)) {
      map[token.type](helpers, token)
    }

    // // To do: flushing too often probably leads to unneeded memory operations.
    // // Once per `write` should be fine? 🤷‍
    // if (name === 'exit' && index !== 0 && queue === undefined) {
    //   buffer = buffer.slice(index)
    //   index = 0
    //   place.index = index
    // }
  }

  function slice(token) {
    return buffer.slice(token.start.index, token.end.index)
  }

  //
  // State machine.
  //

  function textStart() {
    return textInitial
  }

  function textInitial() {
    return text
  }

  function notText(code) {
    // Data.
    if (code === code) {
      enter('data')
      consume(code)
      return data
    }

    // EOF:
    consume(code)
    return text
  }

  function data(code) {
    // Markup or EOF.
    if (own.call(allHooks.text, code) || code !== code) {
      exit('data')
      return text
    }

    // Data.
    consume(code)
    return data
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

      eventQueue = resolveTo(startEventQueue.concat(resolve(eventQueue)))
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
      place = Object.assign({}, startPlace)
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

  function emitAll(evs, hooks) {
    var resolvers = Object.keys(hooks)
      .flatMap((k) => hooks[k])
      .map((h) => h.resolveAll)
      .filter(Boolean)
      .filter((d, i, a) => a.indexOf(d) === i)
    var length
    var index = -1
    var events = evs
    var ev

    resolvers.forEach((r) => {
      events = r(events)
    })

    length = events.length

    while (++index < length) {
      ev = events[index]
      emit(ev[0], ev[1])
    }
  }
}

function identity(x) {
  return x
}
