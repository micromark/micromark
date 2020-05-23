'use strict'

var test = require('tape')
var m = require('../../..')

test('hard linebreaks', function (t) {
  t.equal(
    m('foo  \nbaz'),
    '<p>foo<br />\nbaz</p>',
    'should support hard breaks with two spaces'
  )

  t.equal(
    m('foo\\\nbaz'),
    '<p>foo<br />\nbaz</p>',
    'should support hard breaks with escape'
  )

  t.equal(
    m('foo       \nbaz'),
    '<p>foo<br />\nbaz</p>',
    'should support multiple spaces'
  )

  t.equal(
    m('foo  \n     bar'),
    '<p>foo<br />\nbar</p>',
    'should support leading and trailing whitespace'
  )

  t.equal(
    m('foo\\\n     bar'),
    '<p>foo<br />\nbar</p>',
    'should support leading and trailing whitespace for escapes'
  )

  t.equal(
    m('*foo  \nbar*'),
    '<p><em>foo<br />\nbar</em></p>',
    'should support trailing breaks in emphasis'
  )

  t.equal(
    m('*foo\\\nbar*'),
    '<p><em>foo<br />\nbar</em></p>',
    'should support escape breaks in emphasis'
  )

  t.equal(
    m('`code  \nspan`'),
    '<p><code>code   span</code></p>',
    'should not support trailing breaks in code'
  )

  t.equal(
    m('``code\\\nspan``'),
    '<p><code>code\\ span</code></p>',
    'should not support escape breaks in code'
  )

  // Not support yet, as we don’t support “paragraphs”.
  // t.equal(
  //   m('foo  '),
  //   '<p>foo</p>',
  //   'should not support trailing breaks at the end of a paragraph'
  // )

  t.equal(
    m('foo\\'),
    '<p>foo\\</p>',
    'should not support escape breaks at the end of a paragraph'
  )

  t.equal(
    m('### foo  '),
    '<h3>foo</h3>',
    'should not support trailing breaks at the end of a heading'
  )

  // t.equal(
  //   m('### foo\\'),
  //   '<h3>foo</h3>',
  //   'should not support escape breaks at the end of a heading'
  // )

  t.end()
})
