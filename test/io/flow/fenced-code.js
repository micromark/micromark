'use strict'

var test = require('tape')
var m = require('../../..')

test('fenced-code', function (t) {
  t.equal(
    m('```\n<\n >\n```'),
    '<pre><code>&lt;\n &gt;\n</code></pre>',
    'should support fenced code with grave accents'
  )

  t.equal(
    m('~~~\n<\n >\n~~~'),
    '<pre><code>&lt;\n &gt;\n</code></pre>',
    'should support fenced code with tildes'
  )

  // // To do: whitespace handling.
  // t.equal(
  //   m('``\nfoo\n``'),
  //   '<p><code>foo</code></p>',
  //   'should not support fenced code with less than two markers'
  // )

  t.equal(
    m('```\naaa\n~~~\n```'),
    '<pre><code>aaa\n~~~\n</code></pre>',
    'should not support mismatched closing fences (1)'
  )

  t.equal(
    m('~~~\naaa\n```\n~~~'),
    '<pre><code>aaa\n```\n</code></pre>',
    'should not support mismatched closing fences (2)'
  )

  t.equal(
    m('````\naaa\n```\n``````'),
    '<pre><code>aaa\n```\n</code></pre>',
    'should support closing fenced longer, but not shorter, than the opening'
  )

  t.equal(
    m('~~~~\naaa\n~~~\n~~~~'),
    '<pre><code>aaa\n~~~\n</code></pre>',
    'should support closing fenced equal to, but not shorter, than the opening'
  )

  t.equal(
    m('```'),
    '<pre><code></code></pre>',
    'should support an EOF after an opening sequence'
  )

  // Note: this is currently slightly against CM, which does not care about the
  // final EOL
  t.equal(
    m('`````\n```\naaa\n'),
    '<pre><code>```\naaa\n</code></pre>',
    'should support an EOF in content'
  )

  // t.equal(
  //   m('> ```\n> aaa\n\nbbb'),
  //   '<blockquote>\n<pre><code>aaa\n</code></pre>\n</blockquote>\n<p>bbb</p>',
  //   'should support no closing fence in a block quote'
  // )

  t.equal(
    m('```\n\n  \n```'),
    '<pre><code>\n  \n</code></pre>',
    'should support blank lines in fenced code'
  )

  t.end()
})
