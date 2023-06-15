/**
 * @typedef {import('micromark-util-types').CompileContext} CompileContext
 * @typedef {import('micromark-util-types').Construct} Construct
 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('micromark-util-types').State} State
 * @typedef {import('micromark-util-types').TokenizeContext} TokenizeContext
 * @typedef {import('micromark-util-types').Tokenizer} Tokenizer
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import concatStream from 'concat-stream'
import {micromark} from 'micromark'
import {stream} from 'micromark/stream'
import {slowStream} from './util/slow-stream.js'

test('syntax extension', function () {
  /** @type {Extension} */
  const syntax = {
    // An unknown key is treated as an existing key, potentially useful for
    // new tokenizers.
    // @ts-expect-error: this is a custom field, which users are supposed to
    // manually type, but the runtime should just support it.
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

  assert.deepEqual(micromark('///'), '<p>///</p>', 'baseline (slash)')
  assert.deepEqual(
    micromark('<<<'),
    '<p>&lt;&lt;&lt;</p>',
    'baseline (less than)'
  )

  assert.deepEqual(
    micromark('///', {extensions: [syntax]}),
    '<hr />',
    'should support syntax extensions (slash)'
  )

  assert.deepEqual(
    micromark('<<<', {extensions: [syntax]}),
    '<hr />',
    'should support syntax extensions for an existing hook (less than)'
  )

  assert.deepEqual(micromark('///'), '<p>///</p>', 'should not taint (slash)')
  assert.deepEqual(
    micromark('<<<'),
    '<p>&lt;&lt;&lt;</p>',
    'should not taint (less than)'
  )

  assert.deepEqual(
    micromark('a <i> b, 1 < 3', {
      allowDangerousHtml: true,
      extensions: [{text: {60: {tokenize: tokenizeJustALessThan}}}]
    }),
    '<p>a i&gt; b, 1  3</p>',
    'should precede over previously attached constructs by default'
  )

  assert.deepEqual(
    micromark('a <i> b, 1 < 3', {
      allowDangerousHtml: true,
      extensions: [
        {text: {60: {tokenize: tokenizeJustALessThan, add: 'after'}}}
      ]
    }),
    '<p>a <i> b, 1  3</p>',
    'should go after previously attached constructs w/ `add: after`'
  )
})

test('html extension', async function (t) {
  /** @type {import('micromark-util-types').Extension} */
  const syntax = {flow: {47: {tokenize: tokenizeCommentLine}}}
  /** @type {import('micromark-util-types').HtmlExtension} */
  const html = {
    // An unknown key is treated as an existing key, probably never useful, but
    // symetrical to syntax extensions.
    unknown: {},
    // @ts-expect-error: custom token, which should be registered in the types.
    enter: {commentLine: enterComment},
    // @ts-expect-error: custom token.
    exit: {commentLine: exitComment}
  }

  assert.deepEqual(micromark('// a\n//\rb'), '<p>// a\n//\rb</p>', 'baseline')

  assert.deepEqual(
    micromark('// a\n//\rb', {extensions: [syntax], htmlExtensions: [html]}),
    '<p>b</p>',
    'should support html extensions'
  )

  assert.deepEqual(
    micromark('// a\n//\rb'),
    '<p>// a\n//\rb</p>',
    'should not taint'
  )

  assert.deepEqual(
    micromark('!', {
      htmlExtensions: [
        /** @type {import('micromark-util-types').HtmlExtension} */
        ({enter: {null: enterDocument}, exit: {null: exitDocument}})
      ]
    }),
    '+\n<p>!</p>-',
    'should support html extensions for documents'
  )

  assert.deepEqual(
    micromark('', {
      htmlExtensions: [
        /** @type {import('micromark-util-types').HtmlExtension} */
        ({enter: {null: enterDocument}, exit: {null: exitDocument}})
      ]
    }),
    '+-',
    'should support html extensions for empty documents'
  )

  await t.test('stream', function () {
    return new Promise((resolve) => {
      slowStream('// a\r\nb')
        .pipe(stream({extensions: [syntax], htmlExtensions: [html]}))
        .pipe(
          concatStream(function (result) {
            assert.equal(result, '<p>b</p>', 'pass')
            resolve(undefined)
          })
        )
    })
  })
})

/**
 * @param {number} marker
 * @returns {Construct}
 */
function createFunkyThematicBreak(marker) {
  return {tokenize: tokenizeFunkyThematicBreak}

  /**
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
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

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeCommentLine(effects, ok, nok) {
  return start

  /** @type {State} */
  function start(code) {
    if (code !== 47) {
      return nok(code)
    }

    // @ts-expect-error: custom.
    effects.enter('commentLine')
    // @ts-expect-error: custom.
    effects.enter('commentLineSequence')
    effects.consume(code)
    return insideSlashes
  }

  /** @type {State} */
  function insideSlashes(code) {
    if (code === 47) {
      effects.consume(code)
      // @ts-expect-error: custom.
      effects.exit('commentLineSequence')
      return afterSlashes
    }

    return nok(code)
  }

  /** @type {State} */
  function afterSlashes(code) {
    // Eol or eof.
    if (code === null || code === -5 || code === -4 || code === -3) {
      // @ts-expect-error: custom.
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
      // @ts-expect-error: custom.
      effects.exit('commentLine')
      return ok(code)
    }

    // Anything else.
    effects.consume(code)
    return insideValue
  }
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeJustALessThan(effects, ok, nok) {
  return start

  /** @type {State} */
  function start(code) {
    if (code !== 60) {
      return nok(code)
    }

    // @ts-expect-error: custom.
    effects.enter('lessThan')
    effects.consume(code)
    // @ts-expect-error: custom.
    effects.exit('lessThan')
    return ok
  }
}

/**
 * @this {CompileContext}
 */
function enterComment() {
  this.buffer()
}

/**
 * @this {CompileContext}
 */
function exitComment() {
  this.resume()
  this.setData('slurpOneLineEnding', true)
}

/**
 * @this {CompileContext}
 */
function enterDocument() {
  this.raw('+')
}

/**
 * @this {CompileContext}
 */
function exitDocument() {
  this.raw('-')
}
