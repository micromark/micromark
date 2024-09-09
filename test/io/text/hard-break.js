import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('hard-break', async function (t) {
  await t.test(
    'should support two trailing spaces to form a hard break',
    async function () {
      assert.equal(micromark('foo  \nbaz'), '<p>foo<br />\nbaz</p>')
    }
  )

  await t.test(
    'should support a backslash to form a hard break',
    async function () {
      assert.equal(micromark('foo\\\nbaz'), '<p>foo<br />\nbaz</p>')
    }
  )

  await t.test('should support multiple trailing spaces', async function () {
    assert.equal(micromark('foo       \nbaz'), '<p>foo<br />\nbaz</p>')
  })

  await t.test(
    'should support leading spaces after a trailing hard break',
    async function () {
      assert.equal(micromark('foo  \n     bar'), '<p>foo<br />\nbar</p>')
    }
  )

  await t.test(
    'should support leading spaces after an escape hard break',
    async function () {
      assert.equal(micromark('foo\\\n     bar'), '<p>foo<br />\nbar</p>')
    }
  )

  await t.test(
    'should support trailing hard breaks in emphasis',
    async function () {
      assert.equal(micromark('*foo  \nbar*'), '<p><em>foo<br />\nbar</em></p>')
    }
  )

  await t.test(
    'should support escape hard breaks in emphasis',
    async function () {
      assert.equal(micromark('*foo\\\nbar*'), '<p><em>foo<br />\nbar</em></p>')
    }
  )

  await t.test(
    'should not support trailing hard breaks in code',
    async function () {
      assert.equal(
        micromark('`code  \ntext`'),
        '<p><code>code   text</code></p>'
      )
    }
  )

  await t.test(
    'should not support escape hard breaks in code',
    async function () {
      assert.equal(
        micromark('``code\\\ntext``'),
        '<p><code>code\\ text</code></p>'
      )
    }
  )

  await t.test(
    'should not support trailing hard breaks at the end of a paragraph',
    async function () {
      assert.equal(micromark('foo  '), '<p>foo</p>')
    }
  )

  await t.test(
    'should not support escape hard breaks at the end of a paragraph',
    async function () {
      assert.equal(micromark('foo\\'), '<p>foo\\</p>')
    }
  )

  await t.test(
    'should not support escape hard breaks at the end of a heading',
    async function () {
      assert.equal(micromark('### foo\\'), '<h3>foo\\</h3>')
    }
  )

  await t.test(
    'should not support trailing hard breaks at the end of a heading',
    async function () {
      assert.equal(micromark('### foo  '), '<h3>foo</h3>')
    }
  )

  await t.test('should support a mixed line suffix (1)', async function () {
    assert.equal(micromark('aaa  \t\nbb'), '<p>aaa\nbb</p>')
  })

  await t.test('should support a mixed line suffix (2)', async function () {
    assert.equal(micromark('aaa\t  \nbb'), '<p>aaa\nbb</p>')
  })

  await t.test('should support a mixed line suffix (3)', async function () {
    assert.equal(micromark('aaa  \t  \nbb'), '<p>aaa\nbb</p>')
  })

  await t.test(
    'should support a hard break after a replacement character',
    async function () {
      assert.equal(micromark('aaa\0  \nbb'), '<p>aaa�<br />\nbb</p>')
    }
  )

  await t.test(
    'should support a line suffix after a replacement character',
    async function () {
      assert.equal(micromark('aaa\0\t\nbb'), '<p>aaa�\nbb</p>')
    }
  )

  await t.test('should support a hard break after a span', async function () {
    assert.equal(micromark('*a*  \nbb'), '<p><em>a</em><br />\nbb</p>')
  })

  await t.test('should support a line suffix after a span', async function () {
    assert.equal(micromark('*a*\t\nbb'), '<p><em>a</em>\nbb</p>')
  })

  await t.test(
    'should support a mixed line suffix after a span (1)',
    async function () {
      assert.equal(micromark('*a*  \t\nbb'), '<p><em>a</em>\nbb</p>')
    }
  )

  await t.test(
    'should support a mixed line suffix after a span (2)',
    async function () {
      assert.equal(micromark('*a*\t  \nbb'), '<p><em>a</em>\nbb</p>')
    }
  )

  await t.test(
    'should support a mixed line suffix after a span (3)',
    async function () {
      assert.equal(micromark('*a*  \t  \nbb'), '<p><em>a</em>\nbb</p>')
    }
  )

  await t.test(
    'should support turning off hard break (escape)',
    async function () {
      assert.equal(
        micromark('a\\\nb', {
          extensions: [{disable: {null: ['hardBreakEscape']}}]
        }),
        '<p>a\\\nb</p>'
      )
    }
  )
})
