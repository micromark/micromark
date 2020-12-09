import test from 'tape'
import m from '../../../lib/index.mjs'

test('default-line-ending', function (t) {
  t.equal(
    m('> a'),
    '<blockquote>\n<p>a</p>\n</blockquote>',
    'should use `\\n` default'
  )

  t.equal(
    m('> a\n'),
    '<blockquote>\n<p>a</p>\n</blockquote>\n',
    'should infer the first line ending (1)'
  )

  t.equal(
    m('> a\r'),
    '<blockquote>\r<p>a</p>\r</blockquote>\r',
    'should infer the first line ending (2)'
  )

  t.equal(
    m('> a\r\n'),
    '<blockquote>\r\n<p>a</p>\r\n</blockquote>\r\n',
    'should infer the first line ending (3)'
  )

  t.equal(
    m('> a', {defaultLineEnding: '\r'}),
    '<blockquote>\r<p>a</p>\r</blockquote>',
    'should support the given line ending'
  )

  t.equal(
    m('> a\n', {defaultLineEnding: '\r'}),
    '<blockquote>\r<p>a</p>\r</blockquote>\n',
    'should support the given line ending, even if line endings exist'
  )

  t.end()
})
