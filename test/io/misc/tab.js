import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('tabs', async function (t) {
  await t.test('flow', async function (t) {
    await t.test('should support a 4*SP to start code', async function () {
      assert.equal(micromark('    x'), '<pre><code>x\n</code></pre>')
    })

    await t.test('should support a HT to start code', async function () {
      assert.equal(micromark('\tx'), '<pre><code>x\n</code></pre>')
    })

    await t.test('should support a SP + HT to start code', async function () {
      assert.equal(micromark(' \tx'), '<pre><code>x\n</code></pre>')
    })

    await t.test('should support a 2*SP + HT to start code', async function () {
      assert.equal(micromark('  \tx'), '<pre><code>x\n</code></pre>')
    })

    await t.test('should support a 3*SP + HT to start code', async function () {
      assert.equal(micromark('   \tx'), '<pre><code>x\n</code></pre>')
    })

    await t.test(
      'should support a 4*SP to start code, and leave the next HT as code data',
      async function () {
        assert.equal(micromark('    \tx'), '<pre><code>\tx\n</code></pre>')
      }
    )

    await t.test(
      'should not support a 3*SP + HT to start an ATX heading',
      async function () {
        assert.equal(micromark('   \t# x'), '<pre><code># x\n</code></pre>')
      }
    )

    await t.test(
      'should not support a 3*SP + HT to start a block quote',
      async function () {
        assert.equal(micromark('   \t> x'), '<pre><code>&gt; x\n</code></pre>')
      }
    )

    await t.test(
      'should not support a 3*SP + HT to start a list item',
      async function () {
        assert.equal(micromark('   \t- x'), '<pre><code>- x\n</code></pre>')
      }
    )

    await t.test(
      'should not support a 3*SP + HT to start a thematic break',
      async function () {
        assert.equal(micromark('   \t---'), '<pre><code>---\n</code></pre>')
      }
    )

    await t.test(
      'should not support a 3*SP + HT to start a thematic break',
      async function () {
        assert.equal(micromark('   \t---'), '<pre><code>---\n</code></pre>')
      }
    )

    await t.test(
      'should not support a 3*SP + HT to start a fenced code',
      async function () {
        assert.equal(micromark('   \t```'), '<pre><code>```\n</code></pre>')
      }
    )

    await t.test(
      'should not support a 3*SP + HT to start HTML',
      async function () {
        assert.equal(
          micromark('   \t<div>'),
          '<pre><code>&lt;div&gt;\n</code></pre>'
        )
      }
    )

    await t.test(
      'should support tabs around ATX heading sequences',
      async function () {
        assert.equal(micromark('#\tx\t#\t'), '<h1>x</h1>')
      }
    )

    await t.test(
      'should support arbitrary tabs around ATX heading sequences',
      async function () {
        assert.equal(micromark('#\t\tx\t\t#\t\t'), '<h1>x</h1>')
      }
    )

    await t.test(
      'should support tabs around fenced code fences, info, and meta',
      async function () {
        assert.equal(
          micromark('```\tx\ty\t\n```\t'),
          '<pre><code class="language-x"></code></pre>'
        )
      }
    )

    await t.test(
      'should support arbitrary tabs around fenced code fences, info, and meta',
      async function () {
        assert.equal(
          micromark('```\t\tx\t\ty\t\t\n```\t\t'),
          '<pre><code class="language-x"></code></pre>'
        )
      }
    )

    await t.test(
      'should not support tabs before fenced code closing fences',
      async function () {
        assert.equal(
          micromark('```x\n\t```'),
          '<pre><code class="language-x">\t```\n</code></pre>\n'
        )
      }
    )

    await t.test(
      'should support tabs in HTML (if whitespace is allowed)',
      async function () {
        assert.equal(
          micromark('<x\ty\tz\t=\t"\tx\t">', {allowDangerousHtml: true}),
          '<x\ty\tz\t=\t"\tx\t">'
        )
      }
    )

    await t.test('should support tabs in thematic breaks', async function () {
      assert.equal(micromark('*\t*\t*\t'), '<hr />')
    })

    await t.test(
      'should support arbitrary tabs in thematic breaks',
      async function () {
        assert.equal(micromark('*\t\t*\t\t*\t\t'), '<hr />')
      }
    )
  })

  await t.test('text', async function (t) {
    await t.test(
      'should not support a tab to start an autolink w/ protocol’s rest',
      async function () {
        assert.equal(micromark('<http:\t>'), '<p>&lt;http:\t&gt;</p>')
      }
    )

    await t.test(
      'should not support a tab in an autolink w/ protocol’s rest',
      async function () {
        assert.equal(micromark('<http:x\t>'), '<p>&lt;http:x\t&gt;</p>')
      }
    )

    await t.test(
      'should not support a tab in an email autolink’s local part',
      async function () {
        assert.equal(
          micromark('<example\t@x.com>'),
          '<p>&lt;example\t@x.com&gt;</p>'
        )
      }
    )

    await t.test(
      'should not support a tab in an email autolink’s label',
      async function () {
        assert.equal(
          micromark('<example@x\ty.com>'),
          '<p>&lt;example@x\ty.com&gt;</p>'
        )
      }
    )

    await t.test('should not support character escaped tab', async function () {
      assert.equal(micromark('\\\tx'), '<p>\\\tx</p>')
    })

    await t.test(
      'should support character reference resolving to a tab',
      async function () {
        assert.equal(micromark('&#9;'), '<p>\t</p>')
      }
    )

    await t.test('should support a tab starting code', async function () {
      assert.equal(micromark('`\tx`'), '<p><code>\tx</code></p>')
    })

    await t.test('should support a tab ending code', async function () {
      assert.equal(micromark('`x\t`'), '<p><code>x\t</code></p>')
    })

    await t.test('should support tabs around code', async function () {
      assert.equal(micromark('`\tx\t`'), '<p><code>\tx\t</code></p>')
    })

    await t.test(
      'should support a tab starting, and a space ending, code',
      async function () {
        assert.equal(micromark('`\tx `'), '<p><code>\tx </code></p>')
      }
    )

    await t.test(
      'should support a space starting, and a tab ending, code',
      async function () {
        assert.equal(micromark('` x\t`'), '<p><code> x\t</code></p>')
      }
    )

    await t.test(
      'should support a trailing tab at a line ending in a paragraph',
      async function () {
        // Note: CM does not strip it in this case.
        // However, that should be a bug there: makes more sense to remove it like
        // trailing spaces.
        assert.equal(micromark('x\t\ny'), '<p>x\ny</p>')
      }
    )

    await t.test(
      'should support an initial tab after a line ending in a paragraph',
      async function () {
        assert.equal(micromark('x\n\ty'), '<p>x\ny</p>')
      }
    )

    await t.test(
      'should support an initial tab in a link label',
      async function () {
        assert.equal(micromark('x[\ty](z)'), '<p>x<a href="z">\ty</a></p>')
      }
    )

    await t.test(
      'should support a final tab in a link label',
      async function () {
        assert.equal(micromark('x[y\t](z)'), '<p>x<a href="z">y\t</a></p>')
      }
    )

    await t.test('should support a tab in a link label', async function () {
      assert.equal(micromark('[x\ty](z)'), '<p><a href="z">x\ty</a></p>')
    })

    await t.test(
      'should support a tab starting a link resource',
      async function () {
        // Note: CM.js bug, see: <https://github.com/commonmark/commonmark.js/issues/191>
        assert.equal(micromark('[x](\ty)'), '<p><a href="y">x</a></p>')
      }
    )

    await t.test(
      'should support a tab ending a link resource',
      async function () {
        assert.equal(micromark('[x](y\t)'), '<p><a href="y">x</a></p>')
      }
    )

    await t.test(
      'should support a tab between a link destination and title',
      async function () {
        assert.equal(
          micromark('[x](y\t"z")'),
          '<p><a href="y" title="z">x</a></p>'
        )
      }
    )
  })

  await t.test('virtual spaces', async function (t) {
    await t.test('should support a tab in fenced code', async function () {
      assert.equal(micromark('```\n\tx'), '<pre><code>\tx\n</code></pre>\n')
    })

    await t.test(
      'should strip 1 space from an initial tab in fenced code if the opening fence is indented as such',
      async function () {
        assert.equal(micromark(' ```\n\tx'), '<pre><code>   x\n</code></pre>\n')
      }
    )

    await t.test(
      'should strip 2 spaces from an initial tab in fenced code if the opening fence is indented as such',
      async function () {
        assert.equal(micromark('  ```\n\tx'), '<pre><code>  x\n</code></pre>\n')
      }
    )

    await t.test(
      'should strip 3 spaces from an initial tab in fenced code if the opening fence is indented as such',
      async function () {
        assert.equal(micromark('   ```\n\tx'), '<pre><code> x\n</code></pre>\n')
      }
    )
  })
})
