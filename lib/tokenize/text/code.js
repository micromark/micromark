exports.tokenize = tokenizeCodeSpan
exports.resolve = resolveCodeSpan

var characters = require('../../util/characters')

function resolveCodeSpan(events) {
  var length = events.length
  var index
  var head = events[3][1]
  var headExit = events[4][1]
  var tail = events[length - 4][1]
  var tailEnter = events[length - 5][1]
  var data = false
  var ev
  var next

  if (
    head.type === 'codePaddingWhitespace' &&
    tail.type === 'codePaddingWhitespace'
  ) {
    index = -1

    // Look for data.
    while (++index < length) {
      if (events[index][1].type === 'codeData') {
        data = true
        break
      }
    }

    if (data) {
      head.type = 'codePadding'
      headExit.type = 'codePadding'
      tailEnter.type = 'codePadding'
      tail.type = 'codePadding'
    }
  }

  index = -1

  while (++index < length) {
    ev = events[index]

    if (ev[1].type === 'codePaddingWhitespace') {
      ev[1].type = 'codeData'
    }

    if (ev[1].type === 'codeData' && ev[0] === 'exit') {
      next = events[index + 1]

      if (
        (next[1].type === 'codeData' ||
          next[1].type === 'codePaddingWhitespace') &&
        next[0] === 'enter'
      ) {
        ev = events[index - 1]
        next = events[index + 2]
        ev[1].end = next[1].end
        next[1].start = ev[1].start
        events.splice(index, 2)
        index -= 2
        length -= 2
      }
    }
  }

  return events
}

function tokenizeCodeSpan(effects, ok, nok) {
  var sizeOpen = 0
  var sizeClose
  var closingFenceToken

  if (effects.previous === characters.graveAccent) {
    return nok
  }

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== characters.graveAccent) return nok(code)

    effects.enter('code')
    effects.enter('codeFence')
    sizeOpen++
    effects.consume(code)

    return openingFence
  }

  // Opening fence.
  function openingFence(code) {
    // More.
    if (code === characters.graveAccent) {
      sizeOpen++
      effects.consume(code)
      return openingFence
    }

    effects.exit('codeFence')
    return gap
  }

  function gap(code) {
    // EOF.
    if (code === characters.eof) {
      return nok(code)
    }

    // Closing fence?
    if (code === characters.graveAccent) {
      closingFenceToken = effects.enter('codeFence')
      effects.consume(code)
      sizeClose = 1
      return closingFence
    }

    // Padding whitespace.
    // Note that tabs don’t work.
    if (
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.space
    ) {
      effects.enter('codePaddingWhitespace')
      effects.consume(code)
      effects.exit('codePaddingWhitespace')
      return gap
    }

    // Data.
    effects.enter('codeData')
    return data
  }

  // In code.
  function data(code) {
    if (
      code === characters.eof ||
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf ||
      code === characters.graveAccent ||
      code === characters.space
    ) {
      effects.exit('codeData')
      return gap
    }

    effects.consume(code)
    return data
  }

  // Closing fence.
  function closingFence(code) {
    // More.
    if (code === characters.graveAccent) {
      sizeClose++
      effects.consume(code)
      return closingFence
    }

    // Done!
    if (sizeClose === sizeOpen) {
      effects.exit('codeFence')
      effects.exit('code')
      return ok(code)
    }

    // More or less accents.
    closingFenceToken.type = 'codeData'
    closingFenceToken = undefined
    sizeClose = undefined
    return data
  }
}
