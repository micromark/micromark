'use strict'

var test = require('tape')
var m = require('../../..')

test('indented-code', function (t) {
  t.equal(
    m('    a simple\n      indented code block'),
    '<pre><code>a simple\n  indented code block\n</code></pre>',
    'should support indented code'
  )

  // // To do: lists.
  // t.equal(
  //   m('  - foo\n\n    bar'),
  //   '<ul>\n<li>\n<p>foo</p>\n<p>bar</p>\n</li>\n</ul>',
  //   'should prefer list item content over indented code (1)'
  // )

  // // To do: lists.
  // t.equal(
  //   m('1.  foo\n\n    - bar'),
  //   '<ol>\n<li>\n<p>foo</p>\n<ul>\n<li>bar</li>\n</ul>\n</li>\n</ol>',
  //   'should prefer list item content over indented code (2)'
  // )

  t.equal(
    m('    <a/>\n    *hi*\n\n    - one'),
    '<pre><code>&lt;a/&gt;\n*hi*\n\n- one\n</code></pre>',
    'should support blank lines in indented code (1)'
  )

  t.equal(
    m('    chunk1\n\n    chunk2\n  \n \n \n    chunk3'),
    '<pre><code>chunk1\n\nchunk2\n\n\n\nchunk3\n</code></pre>',
    'should support blank lines in indented code (2)'
  )

  t.equal(
    m('    chunk1\n      \n      chunk2'),
    '<pre><code>chunk1\n  \n  chunk2\n</code></pre>',
    'should support blank lines in indented code (3)'
  )

  t.equal(
    m('Foo\n    bar'),
    '<p>Foo\nbar</p>',
    'should not support interrupting paragraphs'
  )

  t.equal(
    m('    foo\nbar'),
    '<pre><code>foo\n</code></pre>\n<p>bar</p>',
    'should support paragraphs directly after indented code'
  )

  t.equal(
    m('# Heading\n    foo\nHeading\n------\n    foo\n----'),
    '<h1>Heading</h1>\n<pre><code>foo\n</code></pre>\n<h2>Heading</h2>\n<pre><code>foo\n</code></pre>\n<hr />',
    'should mix w/ other content'
  )

  t.equal(
    m('        foo\n    bar'),
    '<pre><code>    foo\nbar\n</code></pre>',
    'should support extra whitespace on the first line'
  )

  t.equal(
    m('\n    \n    foo\n    '),
    '<pre><code>foo\n</code></pre>\n',
    'should not support initial blank lines'
  )

  t.equal(
    m('    foo  '),
    '<pre><code>foo  \n</code></pre>',
    'should support trailing whitespace'
  )

  t.end()
})
