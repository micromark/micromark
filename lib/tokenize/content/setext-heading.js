exports.tokenize = tokenizeSetextHeading
exports.resolve = resolveSetextHeading

var assert = require('assert')
var characters = require('../../util/characters')
var core = require('../../core')

var tabSize = 4

var closingSequence = {tokenize: tokenizeClosingSequence}

function resolveSetextHeading(events) {
  var index = events.length - 1
  var event
  var content

  while (index) {
    event = events[index]

    if (event[0] === 'enter' && event[1].type === 'setextHeadingLine') {
      // Move past EOL.
      index -= 2
      break
    }

    index--
  }

  var head = events[1]
  var tail = events[index - 1]

  content = {
    type: 'setextHeadingContent',
    start: head[1].start,
    end: tail[1].end
  }

  var tokenizer = core.text(content.start)

  return [].concat(
    [events[0], ['enter', content, head[2]]],
    events[0][2].sliceStream(content).concat(null).flatMap(tokenizer),
    [['exit', content, tail[2]]],
    events.slice(index)
  )
}

function tokenizeSetextHeading(effects, ok, nok) {
  return start

  function start(code) {
    effects.enter('setextHeading')
    return contentStart(code)
  }

  function contentStart(code) {
    assert(
      code !== characters.eof &&
        code !== characters.cr &&
        code !== characters.lf &&
        code !== characters.crlf,
      'expected anything other than EOF, EOL'
    )
    effects.enter('setextHeadingContent')
    effects.consume(code)
    return contentData
  }

  function contentData(code) {
    if (
      code === characters.eof ||
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      effects.exit('setextHeadingContent')
      return contentLineEnd(code)
    }

    effects.consume(code)
    return contentData
  }

  function contentLineEnd(code) {
    if (code === characters.eof) {
      return nok(code)
    }

    assert(
      code === characters.cr ||
        code === characters.lf ||
        code === characters.crlf,
      'expected an EOF or EOL for this state'
    )

    effects.enter('lineFeed')
    effects.consume(code)
    effects.exit('lineFeed')
    return effects.createConstructAttempt(
      closingSequence,
      afterClosingSequence,
      contentStart
    )
  }

  function afterClosingSequence(code) {
    assert(
      code === characters.eof ||
        code === characters.cr ||
        code === characters.lf ||
        code === characters.crlf,
      'expected an EOF or EOL for this state'
    )

    effects.exit('setextHeading')
    return ok(code)
  }
}

function tokenizeClosingSequence(effects, ok, nok) {
  var marker
  var prefixSize

  return closingStart

  function closingStart(code) {
    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.enter('linePrefix')
      prefixSize = 0
      return closingPrefix(code)
    }

    return closingPrefixAfter(code)
  }

  function closingPrefix(code) {
    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      prefixSize++

      // Closing prefix cannot start when indented.
      if (prefixSize >= tabSize) {
        prefixSize = undefined
        return nok(code)
      }

      effects.consume(code)
      return closingPrefix
    }

    prefixSize = undefined
    effects.exit('linePrefix')
    return closingPrefixAfter(code)
  }

  function closingPrefixAfter(code) {
    if (code === characters.dash || code === characters.equalsTo) {
      marker = code
      effects.enter('setextHeadingLine')
      effects.enter('setextHeadingSequence')
      return closingSequence(code)
    }

    return nok(code)
  }

  function closingSequence(code) {
    if (code === marker) {
      effects.consume(code)
      return closingSequence
    }

    effects.exit('setextHeadingSequence')

    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.enter('lineSuffix')
      return closingSequenceAfter(code)
    }

    return closingSequenceEnd(code)
  }

  function closingSequenceAfter(code) {
    if (
      code === characters.ht ||
      code === characters.vs ||
      code === characters.space
    ) {
      effects.consume(code)
      return closingSequenceAfter
    }

    effects.exit('lineSuffix')
    return closingSequenceEnd(code)
  }

  function closingSequenceEnd(code) {
    if (
      code === characters.eof ||
      code === characters.cr ||
      code === characters.lf ||
      code === characters.crlf
    ) {
      effects.exit('setextHeadingLine')
      return ok(code)
    }

    return nok(code)
  }
}
