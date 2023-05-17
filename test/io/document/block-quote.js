import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('block-quote', function () {
  assert.equal(
    micromark('> # a\n> b\n> c'),
    '<blockquote>\n<h1>a</h1>\n<p>b\nc</p>\n</blockquote>',
    'should support block quotes'
  )

  assert.equal(
    micromark('># a\n>b\n> c'),
    '<blockquote>\n<h1>a</h1>\n<p>b\nc</p>\n</blockquote>',
    'should support block quotes w/o space'
  )

  assert.equal(
    micromark('   > # a\n   > b\n > c'),
    '<blockquote>\n<h1>a</h1>\n<p>b\nc</p>\n</blockquote>',
    'should support prefixing block quotes w/ spaces'
  )

  assert.equal(
    micromark('    > # a\n    > b\n    > c'),
    '<pre><code>&gt; # a\n&gt; b\n&gt; c\n</code></pre>',
    'should not support block quotes w/ 4 spaces'
  )

  assert.equal(
    micromark('> # a\n> b\nc'),
    '<blockquote>\n<h1>a</h1>\n<p>b\nc</p>\n</blockquote>',
    'should support lazy content lines'
  )

  assert.equal(
    micromark('> a\nb\n> c'),
    '<blockquote>\n<p>a\nb\nc</p>\n</blockquote>',
    'should support lazy content lines inside block quotes'
  )

  assert.equal(
    micromark('> a\n> ---'),
    '<blockquote>\n<h2>a</h2>\n</blockquote>',
    'should support setext headings underlines in block quotes'
  )

  assert.equal(
    micromark('> a\n---'),
    '<blockquote>\n<p>a</p>\n</blockquote>\n<hr />',
    'should not support lazy setext headings underlines in block quotes'
  )

  assert.equal(
    micromark('> - a\n> - b'),
    '<blockquote>\n<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n</blockquote>',
    'should support lists in block quotes'
  )

  assert.equal(
    micromark('> - a\n- b'),
    '<blockquote>\n<ul>\n<li>a</li>\n</ul>\n</blockquote>\n<ul>\n<li>b</li>\n</ul>',
    'should not support lazy lists in block quotes'
  )

  assert.equal(
    micromark('>     a\n    b'),
    '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<pre><code>b\n</code></pre>',
    'should not support lazy indented code in block quotes'
  )

  assert.equal(
    micromark('> ```\na\n```'),
    '<blockquote>\n<pre><code></code></pre>\n</blockquote>\n<p>a</p>\n<pre><code></code></pre>\n',
    'should not support lazy fenced code in block quotes'
  )

  assert.equal(
    micromark('> a\n    - b'),
    '<blockquote>\n<p>a\n- b</p>\n</blockquote>',
    'should not support lazy indented code (or lazy list) in block quotes'
  )

  assert.equal(
    micromark('>'),
    '<blockquote>\n</blockquote>',
    'should support empty block quotes (1)'
  )

  assert.equal(
    micromark('>\n>  \n> '),
    '<blockquote>\n</blockquote>',
    'should support empty block quotes (2)'
  )

  assert.equal(
    micromark('>\n> a\n>  '),
    '<blockquote>\n<p>a</p>\n</blockquote>',
    'should support initial or final lazy empty block quote lines'
  )

  assert.equal(
    micromark('> a\n\n> b'),
    '<blockquote>\n<p>a</p>\n</blockquote>\n<blockquote>\n<p>b</p>\n</blockquote>',
    'should support adjacent block quotes'
  )

  assert.equal(
    micromark('> a\n> b'),
    '<blockquote>\n<p>a\nb</p>\n</blockquote>',
    'should support a paragraph in a block quote'
  )

  assert.equal(
    micromark('> a\n>\n> b'),
    '<blockquote>\n<p>a</p>\n<p>b</p>\n</blockquote>',
    'should support adjacent paragraphs in block quotes'
  )

  assert.equal(
    micromark('a\n> b'),
    '<p>a</p>\n<blockquote>\n<p>b</p>\n</blockquote>',
    'should support interrupting paragraphs w/ block quotes'
  )

  assert.equal(
    micromark('> a\n***\n> b'),
    '<blockquote>\n<p>a</p>\n</blockquote>\n<hr />\n<blockquote>\n<p>b</p>\n</blockquote>',
    'should support interrupting block quotes w/ thematic breaks'
  )

  assert.equal(
    micromark('> a\nb'),
    '<blockquote>\n<p>a\nb</p>\n</blockquote>',
    'should not support interrupting block quotes w/ paragraphs'
  )

  assert.equal(
    micromark('> a\n\nb'),
    '<blockquote>\n<p>a</p>\n</blockquote>\n<p>b</p>',
    'should support interrupting block quotes w/ blank lines'
  )

  assert.equal(
    micromark('> a\n>\nb'),
    '<blockquote>\n<p>a</p>\n</blockquote>\n<p>b</p>',
    'should not support interrupting a blank line in a block quotes w/ paragraphs'
  )

  assert.equal(
    micromark('> > > a\nb'),
    '<blockquote>\n<blockquote>\n<blockquote>\n<p>a\nb</p>\n</blockquote>\n</blockquote>\n</blockquote>',
    'should not support interrupting many block quotes w/ paragraphs (1)'
  )

  assert.equal(
    micromark('>>> a\n> b\n>>c'),
    '<blockquote>\n<blockquote>\n<blockquote>\n<p>a\nb\nc</p>\n</blockquote>\n</blockquote>\n</blockquote>',
    'should not support interrupting many block quotes w/ paragraphs (2)'
  )

  assert.equal(
    micromark('>     a\n\n>    b'),
    '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<blockquote>\n<p>b</p>\n</blockquote>',
    'should support 5 spaces for indented code, not 4'
  )

  assert.equal(
    micromark('> # a\n> b\n> c', {
      extensions: [{disable: {null: ['blockQuote']}}]
    }),
    '<p>&gt; # a\n&gt; b\n&gt; c</p>',
    'should support turning off block quotes'
  )
})
