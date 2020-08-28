'use strict'

var test = require('tape')
var m = require('../../..')

test('hard-break', function (t) {
  t.equal(
    m('foo  \nbaz'),
    '<p>foo<br />\nbaz</p>',
    'should support two trailing spaces to form a hard break'
  )

  t.equal(
    m('foo\\\nbaz'),
    '<p>foo<br />\nbaz</p>',
    'should support a backslash to form a hard break'
  )

  t.equal(
    m('foo       \nbaz'),
    '<p>foo<br />\nbaz</p>',
    'should support multiple trailing spaces'
  )

  t.equal(
    m('foo  \n     bar'),
    '<p>foo<br />\nbar</p>',
    'should support leading spaces after a trailing hard break'
  )

  t.equal(
    m('foo\\\n     bar'),
    '<p>foo<br />\nbar</p>',
    'should support leading spaces after an escape hard break'
  )

  t.equal(
    m('*foo  \nbar*'),
    '<p><em>foo<br />\nbar</em></p>',
    'should support trailing hard breaks in emphasis'
  )

  t.equal(
    m('*foo\\\nbar*'),
    '<p><em>foo<br />\nbar</em></p>',
    'should support escape hard breaks in emphasis'
  )

  t.equal(
    m('`code  \ntext`'),
    '<p><code>code   text</code></p>',
    'should not support trailing hard breaks in code'
  )

  t.equal(
    m('``code\\\ntext``'),
    '<p><code>code\\ text</code></p>',
    'should not support escape hard breaks in code'
  )

  t.equal(
    m('foo  '),
    '<p>foo</p>',
    'should not support trailing hard breaks at the end of a paragraph'
  )

  t.equal(
    m('foo\\'),
    '<p>foo\\</p>',
    'should not support escape hard breaks at the end of a paragraph'
  )

  t.equal(
    m('### foo\\'),
    '<h3>foo\\</h3>',
    'should not support escape hard breaks at the end of a heading'
  )

  t.equal(
    m('### foo  '),
    '<h3>foo</h3>',
    'should not support trailing hard breaks at the end of a heading'
  )

  t.end()
})
