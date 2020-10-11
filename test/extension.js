import test from 'tape'
import concat from 'concat-stream'
import slowStream from './util/slow-stream'
import m from '..'
import createStream from '../stream'

test('syntax extension', function (t) {
  var syntax = {
    // An unknown key is treated as an existing key, potentially useful for
    // new tokenizers.
    unknown: {},
    flow: {
      // No construct (dot, not used by default).
      46: undefined,
      // A proper construct (slash, not used).
      47: createFunkyThematicBreak(47),
      // A proper construct (less than, used for html).
      60: createFunkyThematicBreak(60)
    }
  }

  t.deepEqual(m('///'), '<p>///</p>', 'baseline (slash)')
  t.deepEqual(m('<<<'), '<p>&lt;&lt;&lt;</p>', 'baseline (less than)')

  t.deepEqual(
    m('///', {extensions: [syntax]}),
    '<hr />',
    'should support syntax extensions (slash)'
  )

  t.deepEqual(
    m('<<<', {extensions: [syntax]}),
    '<hr />',
    'should support syntax extensions for an existing hook (less than)'
  )

  t.deepEqual(m('///'), '<p>///</p>', 'should not taint (slash)')
  t.deepEqual(m('<<<'), '<p>&lt;&lt;&lt;</p>', 'should not taint (less than)')

  t.deepEqual(
    m('a <i> b, 1 < 3', {
      allowDangerousHtml: true,
      extensions: [{text: {60: {tokenize: tokenizeJustALessThan}}}]
    }),
    '<p>a i&gt; b, 1  3</p>',
    'should precede over previously attached constructs by default'
  )

  t.deepEqual(
    m('a <i> b, 1 < 3', {
      allowDangerousHtml: true,
      extensions: [
        {text: {60: {tokenize: tokenizeJustALessThan, add: 'after'}}}
      ]
    }),
    '<p>a <i> b, 1  3</p>',
    'should go after previously attached constructs w/ `add: after`'
  )

  t.end()
})

test('html extension', function (t) {
  var syntax = {flow: {47: {tokenize: tokenizeCommentLine}}}
  var html = {
    // An unknown key is treated as an existing key, probably never useful, but
    // symetrical to syntax extensions.
    unknown: {},
    enter: {commentLine: enterComment},
    exit: {commentLine: exitComment}
  }

  t.deepEqual(m('// a\n//\rb'), '<p>// a\n//\rb</p>', 'baseline')

  t.deepEqual(
    m('// a\n//\rb', {extensions: [syntax], htmlExtensions: [html]}),
    '<p>b</p>',
    'should support html extensions'
  )

  t.deepEqual(m('// a\n//\rb'), '<p>// a\n//\rb</p>', 'should not taint')

  t.deepEqual(
    m('!', {
      htmlExtensions: [
        {enter: {null: enterDocument}, exit: {null: exitDocument}}
      ]
    }),
    '+\n<p>!</p>-',
    'should support html extensions for documents'
  )

  t.deepEqual(
    m('', {
      htmlExtensions: [
        {enter: {null: enterDocument}, exit: {null: exitDocument}}
      ]
    }),
    '+-',
    'should support html extensions for empty documents'
  )

  t.test('stream', function (t) {
    t.plan(1)

    slowStream('// a\r\nb')
      .pipe(createStream({extensions: [syntax], htmlExtensions: [html]}))
      .pipe(concat(onconcat))

    function onconcat(result) {
      t.equal(result, '<p>b</p>', 'pass')
    }
  })

  t.end()
})

function createFunkyThematicBreak(marker) {
  return {tokenize: tokenizeFunkyThematicBreak}

  function tokenizeFunkyThematicBreak(effects, ok, nok) {
    var size = 0

    return start

    function start(code) {
      if (code !== marker) {
        return nok(code)
      }

      effects.enter('thematicBreak')
      return atBreak(code)
    }

    function atBreak(code) {
      // Plus.
      if (code === marker) {
        effects.enter('thematicBreakSequence')
        return sequence(code)
      }

      // Whitespace.
      if (code === -2 || code === -1 || code === 32) {
        effects.enter('whitespace')
        return whitespace(code)
      }

      // Eol or eof.
      if (
        size >= 3 &&
        (code === null || code === -5 || code === -4 || code === -3)
      ) {
        effects.exit('thematicBreak')
        return ok(code)
      }

      return nok(code)
    }

    function sequence(code) {
      if (code === marker) {
        effects.consume(code)
        size++
        return sequence
      }

      effects.exit('thematicBreakSequence')
      return atBreak(code)
    }

    function whitespace(code) {
      if (code === -2 || code === -1 || code === 32) {
        effects.consume(code)
        return whitespace
      }

      effects.exit('whitespace')
      return atBreak(code)
    }
  }
}

function tokenizeCommentLine(effects, ok, nok) {
  return start

  function start(code) {
    if (code !== 47) {
      return nok(code)
    }

    effects.enter('commentLine')
    effects.enter('commentLineSequence')
    effects.consume(code)
    return insideSlashes
  }

  function insideSlashes(code) {
    if (code === 47) {
      effects.consume(code)
      effects.exit('commentLineSequence')
      return afterSlashes
    }

    return nok(code)
  }

  function afterSlashes(code) {
    // Eol or eof.
    if (code === null || code === -5 || code === -4 || code === -3) {
      effects.exit('commentLine')
      return ok(code)
    }

    // Anything else: allow character references and escapes.
    effects.enter('chunkString', {contentType: 'string'})
    return insideValue(code)
  }

  function insideValue(code) {
    // Eol or eof.
    if (code === null || code === -5 || code === -4 || code === -3) {
      effects.exit('chunkString')
      effects.exit('commentLine')
      return ok(code)
    }

    // Anything else.
    effects.consume(code)
    return insideValue
  }
}

function tokenizeJustALessThan(effects, ok, nok) {
  return start

  function start(code) {
    if (code !== 60) {
      return nok(code)
    }

    effects.enter('lessThan')
    effects.consume(code)
    effects.exit('lessThan')
    return ok
  }
}

function enterComment() {
  this.buffer()
}

function exitComment() {
  this.resume()
  this.setData('slurpOneLineEnding', true)
}

function enterDocument() {
  this.raw('+')
}

function exitDocument() {
  this.raw('-')
}
