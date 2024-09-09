import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('default-line-ending', async function (t) {
  await t.test('should use `\\n` default', async function () {
    assert.equal(micromark('> a'), '<blockquote>\n<p>a</p>\n</blockquote>')
  })

  await t.test('should infer the first line ending (1)', async function () {
    assert.equal(micromark('> a\n'), '<blockquote>\n<p>a</p>\n</blockquote>\n')
  })

  await t.test('should infer the first line ending (2)', async function () {
    assert.equal(micromark('> a\r'), '<blockquote>\r<p>a</p>\r</blockquote>\r')
  })

  await t.test('should infer the first line ending (3)', async function () {
    assert.equal(
      micromark('> a\r\n'),
      '<blockquote>\r\n<p>a</p>\r\n</blockquote>\r\n'
    )
  })

  await t.test('should support the given line ending', async function () {
    assert.equal(
      micromark('> a', {defaultLineEnding: '\r'}),
      '<blockquote>\r<p>a</p>\r</blockquote>'
    )
  })

  await t.test(
    'should support the given line ending, even if line endings exist',
    async function () {
      assert.equal(
        micromark('> a\n', {defaultLineEnding: '\r'}),
        '<blockquote>\r<p>a</p>\r</blockquote>\n'
      )
    }
  )
})
