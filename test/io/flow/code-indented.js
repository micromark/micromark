import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('code-indented', async function (t) {
  await t.test('should support indented code', async function () {
    assert.equal(
      micromark('    a simple\n      indented code block'),
      '<pre><code>a simple\n  indented code block\n</code></pre>'
    )
  })

  await t.test(
    'should prefer list item content over indented code (1)',
    async function () {
      assert.equal(
        micromark('  - foo\n\n    bar'),
        '<ul>\n<li>\n<p>foo</p>\n<p>bar</p>\n</li>\n</ul>'
      )
    }
  )

  await t.test(
    'should prefer list item content over indented code (2)',
    async function () {
      assert.equal(
        micromark('1.  foo\n\n    - bar'),
        '<ol>\n<li>\n<p>foo</p>\n<ul>\n<li>bar</li>\n</ul>\n</li>\n</ol>'
      )
    }
  )

  await t.test(
    'should support blank lines in indented code (1)',
    async function () {
      assert.equal(
        micromark('    <a/>\n    *hi*\n\n    - one'),
        '<pre><code>&lt;a/&gt;\n*hi*\n\n- one\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support blank lines in indented code (2)',
    async function () {
      assert.equal(
        micromark('    chunk1\n\n    chunk2\n  \n \n \n    chunk3'),
        '<pre><code>chunk1\n\nchunk2\n\n\n\nchunk3\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support blank lines in indented code (3)',
    async function () {
      assert.equal(
        micromark('    chunk1\n      \n      chunk2'),
        '<pre><code>chunk1\n  \n  chunk2\n</code></pre>'
      )
    }
  )

  await t.test('should not support interrupting paragraphs', async function () {
    assert.equal(micromark('Foo\n    bar'), '<p>Foo\nbar</p>')
  })

  await t.test(
    'should support paragraphs directly after indented code',
    async function () {
      assert.equal(
        micromark('    foo\nbar'),
        '<pre><code>foo\n</code></pre>\n<p>bar</p>'
      )
    }
  )

  await t.test('should mix w/ other content', async function () {
    assert.equal(
      micromark('# Heading\n    foo\nHeading\n------\n    foo\n----'),
      '<h1>Heading</h1>\n<pre><code>foo\n</code></pre>\n<h2>Heading</h2>\n<pre><code>foo\n</code></pre>\n<hr />'
    )
  })

  await t.test(
    'should support extra whitespace on the first line',
    async function () {
      assert.equal(
        micromark('        foo\n    bar'),
        '<pre><code>    foo\nbar\n</code></pre>'
      )
    }
  )

  await t.test('should not support initial blank lines', async function () {
    assert.equal(
      micromark('\n    \n    foo\n    '),
      '<pre><code>foo\n</code></pre>'
    )
  })

  await t.test('should support trailing whitespace', async function () {
    assert.equal(micromark('    foo  '), '<pre><code>foo  \n</code></pre>')
  })

  await t.test('should not support lazyness (1)', async function () {
    assert.equal(
      micromark('>     a\nb'),
      '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<p>b</p>'
    )
  })

  await t.test('should not support lazyness (2)', async function () {
    assert.equal(
      micromark('> a\n    b'),
      '<blockquote>\n<p>a\nb</p>\n</blockquote>'
    )
  })

  await t.test('should not support lazyness (3)', async function () {
    assert.equal(
      micromark('> a\n     b'),
      '<blockquote>\n<p>a\nb</p>\n</blockquote>'
    )
  })

  await t.test('should not support lazyness (4)', async function () {
    assert.equal(
      micromark('> a\n      b'),
      '<blockquote>\n<p>a\nb</p>\n</blockquote>'
    )
  })

  await t.test('should not support lazyness (5)', async function () {
    assert.equal(
      micromark('>     a\n    b'),
      '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<pre><code>b\n</code></pre>'
    )
  })

  await t.test('should not support lazyness (6)', async function () {
    assert.equal(
      micromark('>     a\n     b'),
      '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<pre><code> b\n</code></pre>'
    )
  })

  await t.test('should not support lazyness (7)', async function () {
    assert.equal(
      micromark('>     a\n      b'),
      '<blockquote>\n<pre><code>a\n</code></pre>\n</blockquote>\n<pre><code>  b\n</code></pre>'
    )
  })

  await t.test(
    'should support turning off code (indented, 1)',
    async function () {
      assert.equal(
        micromark('   a', {extensions: [{disable: {null: ['codeIndented']}}]}),
        '<p>a</p>'
      )
    }
  )

  await t.test(
    'should support turning off code (indented, 2)',
    async function () {
      assert.equal(
        micromark('> a\n    b', {
          extensions: [{disable: {null: ['codeIndented']}}]
        }),
        '<blockquote>\n<p>a\nb</p>\n</blockquote>'
      )
    }
  )

  await t.test(
    'should support turning off code (indented, 3)',
    async function () {
      assert.equal(
        micromark('- a\n    b', {
          extensions: [{disable: {null: ['codeIndented']}}]
        }),
        '<ul>\n<li>a\nb</li>\n</ul>'
      )
    }
  )

  await t.test(
    'should support turning off code (indented, 4)',
    async function () {
      assert.equal(
        micromark('- a\n    - b', {
          extensions: [{disable: {null: ['codeIndented']}}]
        }),
        '<ul>\n<li>a\n<ul>\n<li>b</li>\n</ul>\n</li>\n</ul>'
      )
    }
  )

  await t.test(
    'should support turning off code (indented, 5)',
    async function () {
      assert.equal(
        micromark('- a\n    - b', {
          extensions: [{disable: {null: ['codeIndented']}}]
        }),
        '<ul>\n<li>a\n<ul>\n<li>b</li>\n</ul>\n</li>\n</ul>'
      )
    }
  )

  await t.test(
    'should support turning off code (indented, 6)',
    async function () {
      assert.equal(
        micromark('```\na\n    ```', {
          extensions: [{disable: {null: ['codeIndented']}}]
        }),
        '<pre><code>a\n</code></pre>'
      )
    }
  )

  await t.test(
    'should support turning off code (indented, 7)',
    async function () {
      assert.equal(
        micromark('a <?\n    ?>', {
          allowDangerousHtml: true,
          extensions: [{disable: {null: ['codeIndented']}}]
        }),
        '<p>a <?\n?></p>'
      )
    }
  )

  await t.test(
    'should support turning off code (indented, 8)',
    async function () {
      assert.equal(
        micromark('- Foo\n---', {
          extensions: [{disable: {null: ['codeIndented']}}]
        }),
        '<ul>\n<li>Foo</li>\n</ul>\n<hr />'
      )
    }
  )

  await t.test(
    'should support turning off code (indented, 9)',
    async function () {
      assert.equal(
        micromark('- Foo\n     ---', {
          extensions: [{disable: {null: ['codeIndented']}}]
        }),
        '<ul>\n<li>\n<h2>Foo</h2>\n</li>\n</ul>'
      )
    }
  )
})
