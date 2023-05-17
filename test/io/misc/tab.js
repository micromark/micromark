import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('tabs', async function (t) {
  await t.test('flow', function () {
    assert.equal(
      micromark('    x'),
      '<pre><code>x\n</code></pre>',
      'should support a 4*SP to start code'
    )

    assert.equal(
      micromark('\tx'),
      '<pre><code>x\n</code></pre>',
      'should support a HT to start code'
    )

    assert.equal(
      micromark(' \tx'),
      '<pre><code>x\n</code></pre>',
      'should support a SP + HT to start code'
    )

    assert.equal(
      micromark('  \tx'),
      '<pre><code>x\n</code></pre>',
      'should support a 2*SP + HT to start code'
    )

    assert.equal(
      micromark('   \tx'),
      '<pre><code>x\n</code></pre>',
      'should support a 3*SP + HT to start code'
    )

    assert.equal(
      micromark('    \tx'),
      '<pre><code>\tx\n</code></pre>',
      'should support a 4*SP to start code, and leave the next HT as code data'
    )

    assert.equal(
      micromark('   \t# x'),
      '<pre><code># x\n</code></pre>',
      'should not support a 3*SP + HT to start an ATX heading'
    )

    assert.equal(
      micromark('   \t> x'),
      '<pre><code>&gt; x\n</code></pre>',
      'should not support a 3*SP + HT to start a block quote'
    )

    assert.equal(
      micromark('   \t- x'),
      '<pre><code>- x\n</code></pre>',
      'should not support a 3*SP + HT to start a list item'
    )

    assert.equal(
      micromark('   \t---'),
      '<pre><code>---\n</code></pre>',
      'should not support a 3*SP + HT to start a thematic break'
    )

    assert.equal(
      micromark('   \t---'),
      '<pre><code>---\n</code></pre>',
      'should not support a 3*SP + HT to start a thematic break'
    )

    assert.equal(
      micromark('   \t```'),
      '<pre><code>```\n</code></pre>',
      'should not support a 3*SP + HT to start a fenced code'
    )

    assert.equal(
      micromark('   \t<div>'),
      '<pre><code>&lt;div&gt;\n</code></pre>',
      'should not support a 3*SP + HT to start HTML'
    )

    assert.equal(
      micromark('#\tx\t#\t'),
      '<h1>x</h1>',
      'should support tabs around ATX heading sequences'
    )

    assert.equal(
      micromark('#\t\tx\t\t#\t\t'),
      '<h1>x</h1>',
      'should support arbitrary tabs around ATX heading sequences'
    )

    assert.equal(
      micromark('```\tx\ty\t\n```\t'),
      '<pre><code class="language-x"></code></pre>',
      'should support tabs around fenced code fences, info, and meta'
    )

    assert.equal(
      micromark('```\t\tx\t\ty\t\t\n```\t\t'),
      '<pre><code class="language-x"></code></pre>',
      'should support arbitrary tabs around fenced code fences, info, and meta'
    )

    assert.equal(
      micromark('```x\n\t```'),
      '<pre><code class="language-x">\t```\n</code></pre>\n',
      'should not support tabs before fenced code closing fences'
    )

    assert.equal(
      micromark('<x\ty\tz\t=\t"\tx\t">', {allowDangerousHtml: true}),
      '<x\ty\tz\t=\t"\tx\t">',
      'should support tabs in HTML (if whitespace is allowed)'
    )

    assert.equal(
      micromark('*\t*\t*\t'),
      '<hr />',
      'should support tabs in thematic breaks'
    )

    assert.equal(
      micromark('*\t\t*\t\t*\t\t'),
      '<hr />',
      'should support arbitrary tabs in thematic breaks'
    )
  })

  await t.test('text', function () {
    assert.equal(
      micromark('<http:\t>'),
      '<p>&lt;http:\t&gt;</p>',
      'should not support a tab to start an autolink w/ protocol’s rest'
    )

    assert.equal(
      micromark('<http:x\t>'),
      '<p>&lt;http:x\t&gt;</p>',
      'should not support a tab in an autolink w/ protocol’s rest'
    )

    assert.equal(
      micromark('<example\t@x.com>'),
      '<p>&lt;example\t@x.com&gt;</p>',
      'should not support a tab in an email autolink’s local part'
    )

    assert.equal(
      micromark('<example@x\ty.com>'),
      '<p>&lt;example@x\ty.com&gt;</p>',
      'should not support a tab in an email autolink’s label'
    )

    assert.equal(
      micromark('\\\tx'),
      '<p>\\\tx</p>',
      'should not support character escaped tab'
    )

    assert.equal(
      micromark('&#9;'),
      '<p>\t</p>',
      'should support character reference resolving to a tab'
    )

    assert.equal(
      micromark('`\tx`'),
      '<p><code>\tx</code></p>',
      'should support a tab starting code'
    )

    assert.equal(
      micromark('`x\t`'),
      '<p><code>x\t</code></p>',
      'should support a tab ending code'
    )

    assert.equal(
      micromark('`\tx\t`'),
      '<p><code>\tx\t</code></p>',
      'should support tabs around code'
    )

    assert.equal(
      micromark('`\tx `'),
      '<p><code>\tx </code></p>',
      'should support a tab starting, and a space ending, code'
    )

    assert.equal(
      micromark('` x\t`'),
      '<p><code> x\t</code></p>',
      'should support a space starting, and a tab ending, code'
    )

    // Note: CM does not strip it in this case.
    // However, that should be a bug there: makes more sense to remove it like
    // trailing spaces.
    assert.equal(
      micromark('x\t\ny'),
      '<p>x\ny</p>',
      'should support a trailing tab at a line ending in a paragraph'
    )

    assert.equal(
      micromark('x\n\ty'),
      '<p>x\ny</p>',
      'should support an initial tab after a line ending in a paragraph'
    )

    assert.equal(
      micromark('x[\ty](z)'),
      '<p>x<a href="z">\ty</a></p>',
      'should support an initial tab in a link label'
    )

    assert.equal(
      micromark('x[y\t](z)'),
      '<p>x<a href="z">y\t</a></p>',
      'should support a final tab in a link label'
    )

    assert.equal(
      micromark('[x\ty](z)'),
      '<p><a href="z">x\ty</a></p>',
      'should support a tab in a link label'
    )

    // Note: CM.js bug, see: <https://github.com/commonmark/commonmark.js/issues/191>
    assert.equal(
      micromark('[x](\ty)'),
      '<p><a href="y">x</a></p>',
      'should support a tab starting a link resource'
    )

    assert.equal(
      micromark('[x](y\t)'),
      '<p><a href="y">x</a></p>',
      'should support a tab ending a link resource'
    )

    assert.equal(
      micromark('[x](y\t"z")'),
      '<p><a href="y" title="z">x</a></p>',
      'should support a tab between a link destination and title'
    )
  })

  await t.test('virtual spaces', function () {
    assert.equal(
      micromark('```\n\tx'),
      '<pre><code>\tx\n</code></pre>\n',
      'should support a tab in fenced code'
    )

    assert.equal(
      micromark(' ```\n\tx'),
      '<pre><code>   x\n</code></pre>\n',
      'should strip 1 space from an initial tab in fenced code if the opening fence is indented as such'
    )

    assert.equal(
      micromark('  ```\n\tx'),
      '<pre><code>  x\n</code></pre>\n',
      'should strip 2 spaces from an initial tab in fenced code if the opening fence is indented as such'
    )

    assert.equal(
      micromark('   ```\n\tx'),
      '<pre><code> x\n</code></pre>\n',
      'should strip 3 spaces from an initial tab in fenced code if the opening fence is indented as such'
    )
  })
})
