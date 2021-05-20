/**
 * @typedef {import('../lib/micromark/index.js').Construct} Construct
 * @typedef {import('../lib/micromark/index.js').Tokenizer} Tokenizer
 * @typedef {import('../lib/micromark/index.js').State} State
 * @typedef {import('../lib/micromark/index.js').Code} Code
 * @typedef {import('../lib/micromark/index.js').Handle} Handle
 * @typedef {import('../lib/micromark/index.js').HtmlExtension} HtmlExtension
 * @typedef {import('../lib/micromark/index.js').Extension} Extension
 */

import test from 'tape'
import concat from 'concat-stream'
import {slowStream} from './util/slow-stream.js'
import {buffer as micromark} from '../lib/micromark/index.js'
import {stream} from '../lib/micromark/stream.js'

test('syntax extension', function (t) {
  /** @type {Extension} */
  const syntax = {
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

  t.deepEqual(micromark('///'), '<p>///</p>', 'baseline (slash)')
  t.deepEqual(micromark('<<<'), '<p>&lt;&lt;&lt;</p>', 'baseline (less than)')

  t.deepEqual(
    micromark('///', {extensions: [syntax]}),
    '<hr />',
    'should support syntax extensions (slash)'
  )

  t.deepEqual(
    micromark('<<<', {extensions: [syntax]}),
    '<hr />',
    'should support syntax extensions for an existing hook (less than)'
  )

  t.deepEqual(micromark('///'), '<p>///</p>', 'should not taint (slash)')
  t.deepEqual(
    micromark('<<<'),
    '<p>&lt;&lt;&lt;</p>',
    'should not taint (less than)'
  )

  t.deepEqual(
    micromark('a <i> b, 1 < 3', {
      allowDangerousHtml: true,
      extensions: [{text: {60: {tokenize: tokenizeJustALessThan}}}]
    }),
    '<p>a i&gt; b, 1  3</p>',
    'should precede over previously attached constructs by default'
  )

  t.deepEqual(
    micromark('a <i> b, 1 < 3', {
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
  const syntax = {flow: {47: {tokenize: tokenizeCommentLine}}}
  const html = {
    // An unknown key is treated as an existing key, probably never useful, but
    // symetrical to syntax extensions.
    unknown: {},
    enter: {commentLine: enterComment},
    exit: {commentLine: exitComment}
  }

  t.deepEqual(micromark('// a\n//\rb'), '<p>// a\n//\rb</p>', 'baseline')

  t.deepEqual(
    micromark('// a\n//\rb', {extensions: [syntax], htmlExtensions: [html]}),
    '<p>b</p>',
    'should support html extensions'
  )

  t.deepEqual(
    micromark('// a\n//\rb'),
    '<p>// a\n//\rb</p>',
    'should not taint'
  )

  t.deepEqual(
    micromark('!', {
      htmlExtensions: [
        {enter: {null: enterDocument}, exit: {null: exitDocument}}
      ]
    }),
    '+\n<p>!</p>-',
    'should support html extensions for documents'
  )

  t.deepEqual(
    micromark('', {
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
      .pipe(stream({extensions: [syntax], htmlExtensions: [html]}))
      .pipe(
        concat(function (result) {
          t.equal(result, '<p>b</p>', 'pass')
        })
      )
  })

  t.end()
})

/**
 * @param {number} marker
 * @returns {Construct}
 */
function createFunkyThematicBreak(marker) {
  return {tokenize: tokenizeFunkyThematicBreak}

  /** @type {Tokenizer} */
  function tokenizeFunkyThematicBreak(effects, ok, nok) {
    let size = 0

    return start

    /** @type {State} */
    function start(code) {
      if (code !== marker) {
        return nok(code)
      }

      effects.enter('thematicBreak')
      return atBreak(code)
    }

    /** @type {State} */
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

    /** @type {State} */
    function sequence(code) {
      if (code === marker) {
        effects.consume(code)
        size++
        return sequence
      }

      effects.exit('thematicBreakSequence')
      return atBreak(code)
    }

    /** @type {State} */
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

/** @type {Tokenizer} */
function tokenizeCommentLine(effects, ok, nok) {
  return start

  /** @type {State} */
  function start(code) {
    if (code !== 47) {
      return nok(code)
    }

    effects.enter('commentLine')
    effects.enter('commentLineSequence')
    effects.consume(code)
    return insideSlashes
  }

  /** @type {State} */
  function insideSlashes(code) {
    if (code === 47) {
      effects.consume(code)
      effects.exit('commentLineSequence')
      return afterSlashes
    }

    return nok(code)
  }

  /** @type {State} */
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

  /** @type {State} */
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

/** @type {Tokenizer} */
function tokenizeJustALessThan(effects, ok, nok) {
  return start

  /** @type {State} */
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

/** @type {Handle} */
function enterComment() {
  this.buffer()
}

/** @type {Handle} */
function exitComment() {
  this.resume()
  this.setData('slurpOneLineEnding', true)
}

/** @type {Handle} */
function enterDocument() {
  this.raw('+')
}

/** @type {Handle} */
function exitDocument() {
  this.raw('-')
}
