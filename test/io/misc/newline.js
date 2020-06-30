'use strict'

var test = require('tape')
var m = require('../../..')

test('newline', function (t) {
  t.equal(
    m('a\nb'),
    '<p>a\nb</p>',
    'should support a line feed for a newline inside a paragraph'
  )

  t.equal(
    m('a\rb'),
    '<p>a\rb</p>',
    'should support a carriage return for a newline inside a paragraph'
  )

  t.equal(
    m('a\r\nb'),
    '<p>a\r\nb</p>',
    'should support a carriage return + line feed for a newline inside a paragraph'
  )

  t.equal(
    m('\ta\n\tb'),
    '<pre><code>a\nb\n</code></pre>',
    'should support a line feed in indented code'
  )

  t.equal(
    m('\ta\r\tb'),
    '<pre><code>a\rb\n</code></pre>',
    'should support a carriage return in indented code'
  )

  t.equal(
    m('\ta\r\n\tb'),
    '<pre><code>a\r\nb\n</code></pre>',
    'should support a carriage return + line feed in indented code'
  )

  t.equal(
    m('\ta\n\tb'),
    '<pre><code>a\nb\n</code></pre>',
    'should support a line feed in indented code'
  )

  t.end()
})
