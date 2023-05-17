import {micromark} from 'micromark'
import test from 'tape'

test('code-indented', function (t) {
  t.equal(
    micromark('    a simple\n      indented code block'),
    '<pre><code>a simple\n  indented code block\n</code></pre>',
    'should support indented code'
  )

  t.equal(
    micromark('  - foo\n\n    bar'),
    '<ul>\n<li>\n<p>foo</p>\n<p>bar</p>\n</li>\n</ul>',
    'should prefer list item content over indented code (1)'
  )

  t.equal(
    micromark('1.  foo\n\n    - bar'),
    '<ol>\n<li>\n<p>foo</p>\n<ul>\n<li>bar</li>\n</ul>\n</li>\n</ol>',
    'should prefer list item content over indented code (2)'
  )

  t.equal(
    micromark('    <a/>\n    *hi*\n\n    - one'),
    '<pre><code>&lt;a/&gt;\n*hi*\n\n- one\n</code></pre>',
    'should support blank lines in indented code (1)'
  )

  t.equal(
    micromark('    chunk1\n\n    chunk2\n  \n \n \n    chunk3'),
    '<pre><code>chunk1\n\nchunk2\n\n\n\nchunk3\n</code></pre>',
    'should support blank lines in indented code (2)'
  )

  t.equal(
    micromark('    chunk1\n      \n      chunk2'),
    '<pre><code>chunk1\n  \n  chunk2\n</code></pre>',
    'should support blank lines in indented code (3)'
  )

  t.equal(
    micromark('Foo\n    bar'),
    '<p>Foo\nbar</p>',
    'should not support interrupting paragraphs'
  )

  t.equal(
    micromark('    foo\nbar'),
    '<pre><code>foo\n</code></pre>\n<p>bar</p>',
    'should support paragraphs directly after indented code'
  )

  t.equal(
    micromark('# Heading\n    foo\nHeading\n------\n    foo\n----'),
    '<h1>Heading</h1>\n<pre><code>foo\n</code></pre>\n<h2>Heading</h2>\n<pre><code>foo\n</code></pre>\n<hr />',
    'should mix w/ other content'
  )

  t.equal(
    micromark('        foo\n    bar'),
    '<pre><code>    foo\nbar\n</code></pre>',
    'should support extra whitespace on the first line'
  )

  t.equal(
    micromark('\n    \n    foo\n    '),
    '<pre><code>foo\n</code></pre>',
    'should not support initial blank lines'
  )

  t.equal(
    micromark('    foo  '),
    '<pre><code>foo  \n</code></pre>',
    'should support trailing whitespace'
  )

  t.equal(
    micromark('>     a\nb'),
    '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<p>b</p>',
    'should not support lazyness (1)'
  )

  t.equal(
    micromark('> a\n    b'),
    '<blockquote>\n<p>a\nb</p>\n</blockquote>',
    'should not support lazyness (2)'
  )

  t.equal(
    micromark('> a\n     b'),
    '<blockquote>\n<p>a\nb</p>\n</blockquote>',
    'should not support lazyness (3)'
  )

  t.equal(
    micromark('> a\n      b'),
    '<blockquote>\n<p>a\nb</p>\n</blockquote>',
    'should not support lazyness (4)'
  )

  t.equal(
    micromark('>     a\n    b'),
    '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<pre><code>b\n</code></pre>',
    'should not support lazyness (5)'
  )

  t.equal(
    micromark('>     a\n     b'),
    '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<pre><code> b\n</code></pre>',
    'should not support lazyness (6)'
  )

  t.equal(
    micromark('>     a\n      b'),
    '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<pre><code>  b\n</code></pre>',
    'should not support lazyness (7)'
  )

  t.equal(
    micromark('   a', {extensions: [{disable: {null: ['codeIndented']}}]}),
    '<p>a</p>',
    'should support turning off code (indented, 1)'
  )

  t.equal(
    micromark('> a\n    b', {
      extensions: [{disable: {null: ['codeIndented']}}]
    }),
    '<blockquote>\n<p>a\nb</p>\n</blockquote>',
    'should support turning off code (indented, 2)'
  )

  t.equal(
    micromark('- a\n    b', {
      extensions: [{disable: {null: ['codeIndented']}}]
    }),
    '<ul>\n<li>a\nb</li>\n</ul>',
    'should support turning off code (indented, 3)'
  )

  t.equal(
    micromark('- a\n    - b', {
      extensions: [{disable: {null: ['codeIndented']}}]
    }),
    '<ul>\n<li>a\n<ul>\n<li>b</li>\n</ul>\n</li>\n</ul>',
    'should support turning off code (indented, 4)'
  )

  t.equal(
    micromark('- a\n    - b', {
      extensions: [{disable: {null: ['codeIndented']}}]
    }),
    '<ul>\n<li>a\n<ul>\n<li>b</li>\n</ul>\n</li>\n</ul>',
    'should support turning off code (indented, 5)'
  )

  t.equal(
    micromark('```\na\n    ```', {
      extensions: [{disable: {null: ['codeIndented']}}]
    }),
    '<pre><code>a\n</code></pre>',
    'should support turning off code (indented, 6)'
  )

  t.equal(
    micromark('a <?\n    ?>', {
      allowDangerousHtml: true,
      extensions: [{disable: {null: ['codeIndented']}}]
    }),
    '<p>a <?\n?></p>',
    'should support turning off code (indented, 7)'
  )

  t.equal(
    micromark('- Foo\n---', {
      extensions: [{disable: {null: ['codeIndented']}}]
    }),
    '<ul>\n<li>Foo</li>\n</ul>\n<hr />',
    'should support turning off code (indented, 8)'
  )

  t.equal(
    micromark('- Foo\n     ---', {
      extensions: [{disable: {null: ['codeIndented']}}]
    }),
    '<ul>\n<li>\n<h2>Foo</h2>\n</li>\n</ul>',
    'should support turning off code (indented, 9)'
  )

  t.end()
})
