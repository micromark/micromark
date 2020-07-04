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

  t.equal(
    m('***\n### Heading'),
    '<hr />\n<h3>Heading</h3>',
    'should support a line feed between blocks'
  )

  t.equal(
    m('***\r### Heading'),
    '<hr />\r<h3>Heading</h3>',
    'should support a carriage return between blocks'
  )

  t.equal(
    m('***\r\n### Heading'),
    '<hr />\r\n<h3>Heading</h3>',
    'should support a carriage return + line feed between blocks'
  )

  t.equal(
    m('***\n\n\n### Heading\n'),
    '<hr />\n<h3>Heading</h3>\n',
    'should support several line feeds between blocks'
  )

  t.equal(
    m('***\r\r\r### Heading\r'),
    '<hr />\r<h3>Heading</h3>\r',
    'should support several carriage returns between blocks'
  )

  t.equal(
    m('***\r\n\r\n\r\n### Heading\r\n'),
    '<hr />\r\n<h3>Heading</h3>\r\n',
    'should support several carriage return + line feeds between blocks'
  )

  t.equal(
    m('```x\n\n\ny\n\n\n```\n\n\n'),
    '<pre><code class="language-x">\n\ny\n\n\n</code></pre>\n',
    'should support several line feeds in fenced code'
  )

  t.equal(
    m('```x\r\r\ry\r\r\r```\r\r\r'),
    '<pre><code class="language-x">\r\ry\r\r\r</code></pre>\r',
    'should support several carriage returns in fenced code'
  )

  t.equal(
    m('```x\r\n\r\n\r\ny\r\n\r\n\r\n```\r\n\r\n\r\n'),
    '<pre><code class="language-x">\r\n\r\ny\r\n\r\n\r\n</code></pre>\r\n',
    'should support several carriage return + line feeds in fenced code'
  )

  t.equal(
    m('A\r\nB\r\n-\r\nC'),
    '<h2>A\r\nB</h2>\r\n<p>C</p>',
    'should support a carriage return + line feed in content'
  )

  t.end()
})
