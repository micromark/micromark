import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('block-quote', async function (t) {
  await t.test('should support block quotes', async function () {
    assert.equal(
      micromark('> # a\n> b\n> c'),
      '<blockquote>\n<h1>a</h1>\n<p>b\nc</p>\n</blockquote>'
    )
  })

  await t.test('should support block quotes w/o space', async function () {
    assert.equal(
      micromark('># a\n>b\n> c'),
      '<blockquote>\n<h1>a</h1>\n<p>b\nc</p>\n</blockquote>'
    )
  })

  await t.test(
    'should support prefixing block quotes w/ spaces',
    async function () {
      assert.equal(
        micromark('   > # a\n   > b\n > c'),
        '<blockquote>\n<h1>a</h1>\n<p>b\nc</p>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should not support block quotes w/ 4 spaces',
    async function () {
      assert.equal(
        micromark('    > # a\n    > b\n    > c'),
        '<pre><code>&gt; # a\n&gt; b\n&gt; c\n</code></pre>'
      )
    }
  )

  await t.test('should support lazy content lines', async function () {
    assert.equal(
      micromark('> # a\n> b\nc'),
      '<blockquote>\n<h1>a</h1>\n<p>b\nc</p>\n</blockquote>'
    )
  })

  await t.test(
    'should support lazy content lines inside block quotes',
    async function () {
      assert.equal(
        micromark('> a\nb\n> c'),
        '<blockquote>\n<p>a\nb\nc</p>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should support setext headings underlines in block quotes',
    async function () {
      assert.equal(
        micromark('> a\n> ---'),
        '<blockquote>\n<h2>a</h2>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should not support lazy setext headings underlines in block quotes',
    async function () {
      assert.equal(
        micromark('> a\n---'),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<hr />'
      )
    }
  )

  await t.test('should support lists in block quotes', async function () {
    assert.equal(
      micromark('> - a\n> - b'),
      '<blockquote>\n<ul>\n<li>a</li>\n<li>b</li>\n</ul>\n</blockquote>'
    )
  })

  await t.test(
    'should not support lazy lists in block quotes',
    async function () {
      assert.equal(
        micromark('> - a\n- b'),
        '<blockquote>\n<ul>\n<li>a</li>\n</ul>\n</blockquote>\n<ul>\n<li>b</li>\n</ul>'
      )
    }
  )

  await t.test(
    'should not support lazy indented code in block quotes',
    async function () {
      assert.equal(
        micromark('>     a\n    b'),
        '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<pre><code>b\n</code></pre>'
      )
    }
  )

  await t.test(
    'should not support lazy fenced code in block quotes',
    async function () {
      assert.equal(
        micromark('> ```\na\n```'),
        '<blockquote>\n<pre><code></code></pre>\n</blockquote>\n<p>a</p>\n<pre><code></code></pre>\n'
      )
    }
  )

  await t.test(
    'should not support lazy indented code (or lazy list) in block quotes',
    async function () {
      assert.equal(
        micromark('> a\n    - b'),
        '<blockquote>\n<p>a\n- b</p>\n</blockquote>'
      )
    }
  )

  await t.test('should support empty block quotes (1)', async function () {
    assert.equal(micromark('>'), '<blockquote>\n</blockquote>')
  })

  await t.test('should support empty block quotes (2)', async function () {
    assert.equal(micromark('>\n>  \n> '), '<blockquote>\n</blockquote>')
  })

  await t.test(
    'should support initial or final lazy empty block quote lines',
    async function () {
      assert.equal(
        micromark('>\n> a\n>  '),
        '<blockquote>\n<p>a</p>\n</blockquote>'
      )
    }
  )

  await t.test('should support adjacent block quotes', async function () {
    assert.equal(
      micromark('> a\n\n> b'),
      '<blockquote>\n<p>a</p>\n</blockquote>\n<blockquote>\n<p>b</p>\n</blockquote>'
    )
  })

  await t.test(
    'should support a paragraph in a block quote',
    async function () {
      assert.equal(
        micromark('> a\n> b'),
        '<blockquote>\n<p>a\nb</p>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should support adjacent paragraphs in block quotes',
    async function () {
      assert.equal(
        micromark('> a\n>\n> b'),
        '<blockquote>\n<p>a</p>\n<p>b</p>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should support interrupting paragraphs w/ block quotes',
    async function () {
      assert.equal(
        micromark('a\n> b'),
        '<p>a</p>\n<blockquote>\n<p>b</p>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should support interrupting block quotes w/ thematic breaks',
    async function () {
      assert.equal(
        micromark('> a\n***\n> b'),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<hr />\n<blockquote>\n<p>b</p>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should not support interrupting block quotes w/ paragraphs',
    async function () {
      assert.equal(
        micromark('> a\nb'),
        '<blockquote>\n<p>a\nb</p>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should support interrupting block quotes w/ blank lines',
    async function () {
      assert.equal(
        micromark('> a\n\nb'),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<p>b</p>'
      )
    }
  )

  await t.test(
    'should not support interrupting a blank line in a block quotes w/ paragraphs',
    async function () {
      assert.equal(
        micromark('> a\n>\nb'),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<p>b</p>'
      )
    }
  )

  await t.test(
    'should not support interrupting many block quotes w/ paragraphs (1)',
    async function () {
      assert.equal(
        micromark('> > > a\nb'),
        '<blockquote>\n<blockquote>\n<blockquote>\n<p>a\nb</p>\n</blockquote>\n</blockquote>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should not support interrupting many block quotes w/ paragraphs (2)',
    async function () {
      assert.equal(
        micromark('>>> a\n> b\n>>c'),
        '<blockquote>\n<blockquote>\n<blockquote>\n<p>a\nb\nc</p>\n</blockquote>\n</blockquote>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should support 5 spaces for indented code, not 4',
    async function () {
      assert.equal(
        micromark('>     a\n\n>    b'),
        '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<blockquote>\n<p>b</p>\n</blockquote>'
      )
    }
  )

  await t.test('should support turning off block quotes', async function () {
    assert.equal(
      micromark('> # a\n> b\n> c', {
        extensions: [{disable: {null: ['blockQuote']}}]
      }),
      '<p>&gt; # a\n&gt; b\n&gt; c</p>'
    )
  })
})
