exports.tokenize = tokenizeAtxHeading
exports.resolve = resolveAtxHeading

var core = require('../../core')

var tab = 9 // '\t'
var lineFeed = 10 // '\n'
var space = 32 // ' '
var numberSign = 35 // '#'

var max = 6

function resolveAtxHeading(events) {
  var start = 3
  var end = events.length - 2
  var head
  var content
  var tokenizer
  var result

  if (
    events[start][0] === 'enter' &&
    events[start][1].type === 'atxHeadingWhitespace'
  ) {
    start += 2
  }

  if (
    end - 2 >= start &&
    events[end][0] === 'exit' &&
    events[end][1].type === 'atxHeadingWhitespace'
  ) {
    end -= 2
  }

  if (
    events[end][0] === 'exit' &&
    events[end][1].type === 'atxHeadingSequence' &&
    (start === end - 1 ||
      (end - 4 >= start &&
        events[end - 2][0] === 'exit' &&
        events[end - 2][1].type === 'atxHeadingWhitespace'))
  ) {
    events[end][1].type = 'atxHeadingEndFence'
    end -= start === end - 1 ? 2 : 4
  }

  result = events.slice(0, start)

  if (end > start) {
    head = events[start]
    content = {
      type: 'atxHeadingContent',
      start: head[1].start,
      end: events[end][1].end
    }
    tokenizer = core.text(content.start)

    result = [].concat(
      result,
      [['enter', content, head[2]]],
      tokenizer(head[2].slice(content)),
      tokenizer(null),
      [['exit', content, head[2]]]
    )
  }

  return result.concat(events.slice(end + 1))
}

function tokenizeAtxHeading(effects, ok, nok) {
  var size = 0

  return start

  function start(code) {
    /* istanbul ignore next - used when hooking into multiple characters */
    if (code !== numberSign) return nok(code)

    effects.enter('atxHeading')
    effects.enter('atxHeadingStartFence')
    return fenceOpenInside
  }

  function fenceOpenInside(code) {
    if (code !== code || code === tab || code === lineFeed || code === space) {
      effects.exit('atxHeadingStartFence')
      return after
    }

    if (code === numberSign && size < max) {
      size++
      effects.consume(code)
      return fenceOpenInside
    }

    return nok(code)
  }

  function after(code) {
    if (code !== code || code === lineFeed) {
      effects.exit('atxHeading')
      return ok(code)
    }

    if (code === tab || code === space) {
      effects.enter('atxHeadingWhitespace')
      return whitespace
    }

    if (code === numberSign) {
      effects.enter('atxHeadingSequence')
      return sequence
    }

    effects.enter('atxHeadingContent')
    return data
  }

  function whitespace(code) {
    if (code === tab || code === space) {
      effects.consume(code)
      return whitespace
    }

    effects.exit('atxHeadingWhitespace')
    return after(code)
  }

  function sequence(code) {
    if (code === numberSign) {
      effects.consume(code)
      return sequence
    }

    effects.exit('atxHeadingSequence')
    return after(code)
  }

  function data(code) {
    if (
      code !== code ||
      code === tab ||
      code === lineFeed ||
      code === space ||
      code === numberSign
    ) {
      effects.exit('atxHeadingContent')
      return after(code)
    }

    effects.consume(code)
    return data
  }
}
