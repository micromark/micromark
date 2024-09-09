/**
 * @import {
 *   CompileContext,
 *   Construct,
 *   Extension,
 *   HtmlExtension,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

import assert from 'node:assert/strict'
import test from 'node:test'
import concatStream from 'concat-stream'
import {micromark} from 'micromark'
import {stream} from 'micromark/stream'
import {slowStream} from './util/slow-stream.js'

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

test('syntax extension', async function (t) {
  await t.test('baseline (slash)', async function () {
    assert.deepEqual(micromark('///'), '<p>///</p>')
  })

  await t.test('baseline (less than)', async function () {
    assert.deepEqual(micromark('<<<'), '<p>&lt;&lt;&lt;</p>')
  })

  await t.test('should support syntax extensions (slash)', async function () {
    assert.deepEqual(micromark('///', {extensions: [syntax]}), '<hr />')
  })

  await t.test(
    'should support syntax extensions for an existing hook (less than)',
    async function () {
      assert.deepEqual(micromark('<<<', {extensions: [syntax]}), '<hr />')
    }
  )

  await t.test('should not taint (slash)', async function () {
    assert.deepEqual(micromark('///'), '<p>///</p>')
  })

  await t.test('should not taint (less than)', async function () {
    assert.deepEqual(micromark('<<<'), '<p>&lt;&lt;&lt;</p>')
  })

  await t.test(
    'should precede over previously attached constructs by default',
    async function () {
      assert.deepEqual(
        micromark('a <i> b, 1 < 3', {
          allowDangerousHtml: true,
          extensions: [{text: {60: {tokenize: tokenizeJustALessThan}}}]
        }),
        '<p>a i&gt; b, 1  3</p>'
      )
    }
  )

  await t.test(
    'should go after previously attached constructs w/ `add: after`',
    async function () {
      assert.deepEqual(
        micromark('a <i> b, 1 < 3', {
          allowDangerousHtml: true,
          extensions: [
            {text: {60: {tokenize: tokenizeJustALessThan, add: 'after'}}}
          ]
        }),
        '<p>a <i> b, 1  3</p>'
      )
    }
  )
})

test('html extension', async function (t) {
  /** @type {Extension} */
  const syntax = {flow: {47: {tokenize: tokenizeCommentLine}}}
  /** @type {HtmlExtension} */
  const html = {
    // @ts-expect-error: custom token, which should be registered in the types.
    enter: {commentLine: enterComment},
    // @ts-expect-error: custom token.
    exit: {commentLine: exitComment},
    // An unknown key is treated as an existing key, probably never useful, but
    // symetrical to syntax extensions.
    unknown: {}
  }

  await t.test('baseline', async function () {
    assert.deepEqual(micromark('// a\n//\rb'), '<p>// a\n//\rb</p>')
  })

  await t.test('should support html extensions', async function () {
    assert.deepEqual(
      micromark('// a\n//\rb', {
        extensions: [syntax],
        htmlExtensions: [html]
      }),
      '<p>b</p>'
    )
  })

  await t.test('should not taint', async function () {
    assert.deepEqual(micromark('// a\n//\rb'), '<p>// a\n//\rb</p>')
  })

  await t.test(
    'should support html extensions for documents',
    async function () {
      assert.deepEqual(
        micromark('!', {
          htmlExtensions: [
            /** @type {HtmlExtension} */
            ({enter: {null: enterDocument}, exit: {null: exitDocument}})
          ]
        }),
        '+\n<p>!</p>-'
      )
    }
  )

  await t.test(
    'should support html extensions for empty documents',
    async function () {
      assert.deepEqual(
        micromark('', {
          htmlExtensions: [
            /** @type {HtmlExtension} */
            ({enter: {null: enterDocument}, exit: {null: exitDocument}})
          ]
        }),
        '+-'
      )
    }
  )

  await t.test('stream', function () {
    return new Promise(function (resolve) {
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
 *   Marker.
 * @returns {Construct}
 *   Construct.
 */
function createFunkyThematicBreak(marker) {
  return {tokenize: tokenizeFunkyThematicBreak}

  /**
   * @this {TokenizeContext}
   *   Context.
   * @type {Tokenizer}
   *   Tokenizer.
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
 *   Context.
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
 *   Context.
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
 *   Context.
 */
function enterComment() {
  this.buffer()
}

/**
 * @this {CompileContext}
 *   Context.
 */
function exitComment() {
  this.resume()
  this.setData('slurpOneLineEnding', true)
}

/**
 * @this {CompileContext}
 *   Context.
 */
function enterDocument() {
  this.raw('+')
}

/**
 * @this {CompileContext}
 *   Context.
 */
function exitDocument() {
  this.raw('-')
}
