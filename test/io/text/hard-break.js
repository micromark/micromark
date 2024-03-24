import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('hard-break', function () {
  assert.equal(
    micromark('foo  \nbaz'),
    '<p>foo<br />\nbaz</p>',
    'should support two trailing spaces to form a hard break'
  )

  assert.equal(
    micromark('foo\\\nbaz'),
    '<p>foo<br />\nbaz</p>',
    'should support a backslash to form a hard break'
  )

  assert.equal(
    micromark('foo       \nbaz'),
    '<p>foo<br />\nbaz</p>',
    'should support multiple trailing spaces'
  )

  assert.equal(
    micromark('foo  \n     bar'),
    '<p>foo<br />\nbar</p>',
    'should support leading spaces after a trailing hard break'
  )

  assert.equal(
    micromark('foo\\\n     bar'),
    '<p>foo<br />\nbar</p>',
    'should support leading spaces after an escape hard break'
  )

  assert.equal(
    micromark('*foo  \nbar*'),
    '<p><em>foo<br />\nbar</em></p>',
    'should support trailing hard breaks in emphasis'
  )

  assert.equal(
    micromark('*foo\\\nbar*'),
    '<p><em>foo<br />\nbar</em></p>',
    'should support escape hard breaks in emphasis'
  )

  assert.equal(
    micromark('`code  \ntext`'),
    '<p><code>code   text</code></p>',
    'should not support trailing hard breaks in code'
  )

  assert.equal(
    micromark('``code\\\ntext``'),
    '<p><code>code\\ text</code></p>',
    'should not support escape hard breaks in code'
  )

  assert.equal(
    micromark('foo  '),
    '<p>foo</p>',
    'should not support trailing hard breaks at the end of a paragraph'
  )

  assert.equal(
    micromark('foo\\'),
    '<p>foo\\</p>',
    'should not support escape hard breaks at the end of a paragraph'
  )

  assert.equal(
    micromark('### foo\\'),
    '<h3>foo\\</h3>',
    'should not support escape hard breaks at the end of a heading'
  )

  assert.equal(
    micromark('### foo  '),
    '<h3>foo</h3>',
    'should not support trailing hard breaks at the end of a heading'
  )

  assert.equal(
    micromark('aaa  \t\nbb'),
    '<p>aaa\nbb</p>',
    'should support a mixed line suffix (1)'
  )

  assert.equal(
    micromark('aaa\t  \nbb'),
    '<p>aaa\nbb</p>',
    'should support a mixed line suffix (2)'
  )

  assert.equal(
    micromark('aaa  \t  \nbb'),
    '<p>aaa\nbb</p>',
    'should support a mixed line suffix (3)'
  )

  assert.equal(
    micromark('aaa\0  \nbb'),
    '<p>aaa\uFFFD<br />\nbb</p>',
    'should support a hard break after a replacement character'
  )

  assert.equal(
    micromark('aaa\0\t\nbb'),
    '<p>aaa\uFFFD\nbb</p>',
    'should support a line suffix after a replacement character'
  )

  assert.equal(
    micromark('*a*  \nbb'),
    '<p><em>a</em><br />\nbb</p>',
    'should support a hard break after a span'
  )

  assert.equal(
    micromark('*a*\t\nbb'),
    '<p><em>a</em>\nbb</p>',
    'should support a line suffix after a span'
  )

  assert.equal(
    micromark('*a*  \t\nbb'),
    '<p><em>a</em>\nbb</p>',
    'should support a mixed line suffix after a span (1)'
  )

  assert.equal(
    micromark('*a*\t  \nbb'),
    '<p><em>a</em>\nbb</p>',
    'should support a mixed line suffix after a span (2)'
  )

  assert.equal(
    micromark('*a*  \t  \nbb'),
    '<p><em>a</em>\nbb</p>',
    'should support a mixed line suffix after a span (3)'
  )

  assert.equal(
    micromark('a\\\nb', {extensions: [{disable: {null: ['hardBreakEscape']}}]}),
    '<p>a\\\nb</p>',
    'should support turning off hard break (escape)'
  )
})
