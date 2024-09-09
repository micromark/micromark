import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('heading-setext', async function (t) {
  await t.test(
    'should support a heading w/ an equals to (rank of 1)',
    async function () {
      assert.equal(
        micromark('Foo *bar*\n========='),
        '<h1>Foo <em>bar</em></h1>'
      )
    }
  )

  await t.test(
    'should support a heading w/ a dash (rank of 2)',
    async function () {
      assert.equal(
        micromark('Foo *bar*\n---------'),
        '<h2>Foo <em>bar</em></h2>'
      )
    }
  )

  await t.test(
    'should support line endings in setext headings',
    async function () {
      assert.equal(
        micromark('Foo *bar\nbaz*\n===='),
        '<h1>Foo <em>bar\nbaz</em></h1>'
      )
    }
  )

  await t.test(
    'should not include initial and final whitespace around content',
    async function () {
      assert.equal(
        micromark('  Foo *bar\nbaz*\t\n===='),
        '<h1>Foo <em>bar\nbaz</em></h1>'
      )
    }
  )

  await t.test('should support long underlines', async function () {
    assert.equal(micromark('Foo\n-------------------------'), '<h2>Foo</h2>')
  })

  await t.test('should support short underlines', async function () {
    assert.equal(micromark('Foo\n='), '<h1>Foo</h1>')
  })

  await t.test('should support indented content w/ 1 space', async function () {
    assert.equal(micromark(' Foo\n  ==='), '<h1>Foo</h1>')
  })

  await t.test(
    'should support indented content w/ 2 spaces',
    async function () {
      assert.equal(micromark('  Foo\n---'), '<h2>Foo</h2>')
    }
  )

  await t.test(
    'should support indented content w/ 3 spaces',
    async function () {
      assert.equal(micromark('   Foo\n---'), '<h2>Foo</h2>')
    }
  )

  await t.test(
    'should not support too much indented content (1)',
    async function () {
      assert.equal(
        micromark('    Foo\n    ---'),
        '<pre><code>Foo\n---\n</code></pre>'
      )
    }
  )

  await t.test(
    'should not support too much indented content (2)',
    async function () {
      assert.equal(
        micromark('    Foo\n---'),
        '<pre><code>Foo\n</code></pre>\n<hr />'
      )
    }
  )

  await t.test(
    'should support initial and final whitespace around the underline',
    async function () {
      assert.equal(micromark('Foo\n   ----      '), '<h2>Foo</h2>')
    }
  )

  await t.test('should support whitespace before underline', async function () {
    assert.equal(micromark('Foo\n   ='), '<h1>Foo</h1>')
  })

  await t.test(
    'should not support too much whitespace before underline (1)',
    async function () {
      assert.equal(micromark('Foo\n    ='), '<p>Foo\n=</p>')
    }
  )

  await t.test(
    'should not support too much whitespace before underline (2)',
    async function () {
      assert.equal(micromark('Foo\n\t='), '<p>Foo\n=</p>')
    }
  )

  await t.test(
    'should not support whitespace in the underline (1)',
    async function () {
      assert.equal(micromark('Foo\n= ='), '<p>Foo\n= =</p>')
    }
  )

  await t.test(
    'should not support whitespace in the underline (2)',
    async function () {
      assert.equal(micromark('Foo\n--- -'), '<p>Foo</p>\n<hr />')
    }
  )

  await t.test(
    'should not support a hard break w/ spaces at the end',
    async function () {
      assert.equal(micromark('Foo  \n-----'), '<h2>Foo</h2>')
    }
  )

  await t.test(
    'should not support a hard break w/ backslash at the end',
    async function () {
      assert.equal(micromark('Foo\\\n-----'), '<h2>Foo\\</h2>')
    }
  )

  await t.test('should precede over inline constructs (1)', async function () {
    assert.equal(micromark('`Foo\n----\n`'), '<h2>`Foo</h2>\n<p>`</p>')
  })

  await t.test('should precede over inline constructs (2)', async function () {
    assert.equal(
      micromark('<a title="a lot\n---\nof dashes"/>'),
      '<h2>&lt;a title=&quot;a lot</h2>\n<p>of dashes&quot;/&gt;</p>'
    )
  })

  await t.test('should not allow underline to be lazy (1)', async function () {
    assert.equal(
      micromark('> Foo\n---'),
      '<blockquote>\n<p>Foo</p>\n</blockquote>\n<hr />'
    )
  })

  await t.test('should not allow underline to be lazy (2)', async function () {
    assert.equal(
      micromark('> foo\nbar\n==='),
      '<blockquote>\n<p>foo\nbar\n===</p>\n</blockquote>'
    )
  })

  await t.test('should not allow underline to be lazy (3)', async function () {
    assert.equal(micromark('- Foo\n---'), '<ul>\n<li>Foo</li>\n</ul>\n<hr />')
  })

  await t.test(
    'should support line endings in setext headings',
    async function () {
      assert.equal(micromark('Foo\nBar\n---'), '<h2>Foo\nBar</h2>')
    }
  )

  await t.test('should support adjacent setext headings', async function () {
    assert.equal(
      micromark('---\nFoo\n---\nBar\n---\nBaz'),
      '<hr />\n<h2>Foo</h2>\n<h2>Bar</h2>\n<p>Baz</p>'
    )
  })

  await t.test('should not support empty setext headings', async function () {
    assert.equal(micromark('\n===='), '<p>====</p>')
  })

  await t.test(
    'should prefer other constructs over setext headings (1)',
    async function () {
      assert.equal(micromark('---\n---'), '<hr />\n<hr />')
    }
  )

  await t.test(
    'should prefer other constructs over setext headings (2)',
    async function () {
      assert.equal(
        micromark('- foo\n-----'),
        '<ul>\n<li>foo</li>\n</ul>\n<hr />'
      )
    }
  )

  await t.test(
    'should prefer other constructs over setext headings (3)',
    async function () {
      assert.equal(
        micromark('    foo\n---'),
        '<pre><code>foo\n</code></pre>\n<hr />'
      )
    }
  )

  await t.test(
    'should prefer other constructs over setext headings (4)',
    async function () {
      assert.equal(
        micromark('> foo\n-----'),
        '<blockquote>\n<p>foo</p>\n</blockquote>\n<hr />'
      )
    }
  )

  await t.test(
    'should support starting w/ character escapes',
    async function () {
      assert.equal(micromark('\\> foo\n------'), '<h2>&gt; foo</h2>')
    }
  )

  await t.test('paragraph and heading interplay (1)', async function () {
    assert.equal(
      micromark('Foo\nbar\n---\nbaz'),
      '<h2>Foo\nbar</h2>\n<p>baz</p>'
    )
  })

  await t.test('paragraph and heading interplay (2)', async function () {
    assert.equal(
      micromark('Foo\n\nbar\n---\nbaz'),
      '<p>Foo</p>\n<h2>bar</h2>\n<p>baz</p>'
    )
  })

  await t.test('paragraph and heading interplay (3)', async function () {
    assert.equal(
      micromark('Foo\nbar\n\n---\n\nbaz'),
      '<p>Foo\nbar</p>\n<hr />\n<p>baz</p>'
    )
  })

  await t.test('paragraph and heading interplay (4)', async function () {
    assert.equal(
      micromark('Foo\nbar\n* * *\nbaz'),
      '<p>Foo\nbar</p>\n<hr />\n<p>baz</p>'
    )
  })

  await t.test('paragraph and heading interplay (5)', async function () {
    assert.equal(micromark('Foo\nbar\n\\---\nbaz'), '<p>Foo\nbar\n---\nbaz</p>')
  })

  await t.test(
    'should support a hard break w/ spaces in between',
    async function () {
      // Extra:
      assert.equal(micromark('Foo  \nbar\n-----'), '<h2>Foo<br />\nbar</h2>')
    }
  )

  await t.test(
    'should support a hard break w/ backslash in between',
    async function () {
      assert.equal(micromark('Foo\\\nbar\n-----'), '<h2>Foo<br />\nbar</h2>')
    }
  )

  await t.test(
    'should prefer a setext heading over an interrupting list',
    async function () {
      assert.equal(micromark('a\n-\nb'), '<h2>a</h2>\n<p>b</p>')
    }
  )

  await t.test('should not support lazyness (1)', async function () {
    assert.equal(
      micromark('> ===\na'),
      '<blockquote>\n<p>===\na</p>\n</blockquote>'
    )
  })

  await t.test('should not support lazyness (2)', async function () {
    assert.equal(
      micromark('> a\n==='),
      '<blockquote>\n<p>a\n===</p>\n</blockquote>'
    )
  })

  await t.test(
    'should support turning off setext underlines',
    async function () {
      assert.equal(
        micromark('a\n-', {
          extensions: [{disable: {null: ['setextUnderline']}}]
        }),
        '<p>a\n-</p>'
      )
    }
  )
})
