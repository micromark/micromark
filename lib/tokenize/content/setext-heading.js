exports.tokenize = tokenizeSetextHeading
exports.resolve = resolveSetextHeading

var assert = require('assert')
var codes = require('../../character/codes')
var constants = require('../../constant/constants')
var core = require('../../core')

var closingSequence = {tokenize: tokenizeClosingSequence}

function resolveSetextHeading(events) {
  var index = events.length - 1
  var event
  var content
  var head
  var tail

  while (index) {
    event = events[index]

    if (event[0] === 'exit' && event[1].type === 'setextHeadingContent') {
      break
    }

    index--
  }

  head = events[1]
  tail = events[index]

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
    events.slice(index + 1)
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
      code !== codes.eof &&
        code !== codes.cr &&
        code !== codes.lf &&
        code !== codes.crlf,
      'expected anything other than EOF, EOL'
    )
    effects.enter('setextHeadingContent')
    effects.consume(code)
    return contentData
  }

  function contentData(code) {
    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
      effects.exit('setextHeadingContent')
      return contentLineEnd(code)
    }

    effects.consume(code)
    return contentData
  }

  function contentLineEnd(code) {
    if (code === codes.eof) {
      return nok(code)
    }

    assert(
      code === codes.cr || code === codes.lf || code === codes.crlf,
      'expected an EOF or EOL for this state'
    )

    effects.enter('lineEnding')
    effects.consume(code)
    effects.exit('lineEnding')
    return effects.createConstructAttempt(
      closingSequence,
      afterClosingSequence,
      contentStart
    )
  }

  function afterClosingSequence(code) {
    assert(
      code === codes.eof ||
        code === codes.cr ||
        code === codes.lf ||
        code === codes.crlf,
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
    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.enter('linePrefix')
      prefixSize = 0
      return closingPrefix(code)
    }

    return closingPrefixAfter(code)
  }

  function closingPrefix(code) {
    if (code === codes.ht || code === codes.vs || code === codes.space) {
      prefixSize++

      // Closing prefix cannot start when indented.
      if (prefixSize >= constants.tabSize) {
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
    if (code === codes.dash || code === codes.equalsTo) {
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

    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.enter('lineSuffix')
      return closingSequenceAfter(code)
    }

    return closingSequenceEnd(code)
  }

  function closingSequenceAfter(code) {
    if (code === codes.ht || code === codes.vs || code === codes.space) {
      effects.consume(code)
      return closingSequenceAfter
    }

    effects.exit('lineSuffix')
    return closingSequenceEnd(code)
  }

  function closingSequenceEnd(code) {
    if (
      code === codes.eof ||
      code === codes.cr ||
      code === codes.lf ||
      code === codes.crlf
    ) {
      effects.exit('setextHeadingLine')
      return ok(code)
    }

    return nok(code)
  }
}
