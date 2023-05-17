import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('default-line-ending', function () {
  assert.equal(
    micromark('> a'),
    '<blockquote>\n<p>a</p>\n</blockquote>',
    'should use `\\n` default'
  )

  assert.equal(
    micromark('> a\n'),
    '<blockquote>\n<p>a</p>\n</blockquote>\n',
    'should infer the first line ending (1)'
  )

  assert.equal(
    micromark('> a\r'),
    '<blockquote>\r<p>a</p>\r</blockquote>\r',
    'should infer the first line ending (2)'
  )

  assert.equal(
    micromark('> a\r\n'),
    '<blockquote>\r\n<p>a</p>\r\n</blockquote>\r\n',
    'should infer the first line ending (3)'
  )

  assert.equal(
    micromark('> a', {defaultLineEnding: '\r'}),
    '<blockquote>\r<p>a</p>\r</blockquote>',
    'should support the given line ending'
  )

  assert.equal(
    micromark('> a\n', {defaultLineEnding: '\r'}),
    '<blockquote>\r<p>a</p>\r</blockquote>\n',
    'should support the given line ending, even if line endings exist'
  )
})
