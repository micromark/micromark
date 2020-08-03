'use strict'

var test = require('tape')
var m = require('../../..')

test('tabs', function (t) {
  t.test('flow', function (t) {
    t.equal(
      m('    x'),
      '<pre><code>x\n</code></pre>',
      'should support a 4*SP to start code'
    )

    t.equal(
      m('\tx'),
      '<pre><code>x\n</code></pre>',
      'should support a HT to start code'
    )

    t.equal(
      m(' \tx'),
      '<pre><code>x\n</code></pre>',
      'should support a SP + HT to start code'
    )

    t.equal(
      m('  \tx'),
      '<pre><code>x\n</code></pre>',
      'should support a 2*SP + HT to start code'
    )

    t.equal(
      m('   \tx'),
      '<pre><code>x\n</code></pre>',
      'should support a 3*SP + HT to start code'
    )

    t.equal(
      m('    \tx'),
      '<pre><code>\tx\n</code></pre>',
      'should support a 4*SP to start code, and leave the next HT as code data'
    )

    t.equal(
      m('   \t# x'),
      '<pre><code># x\n</code></pre>',
      'should not support a 3*SP + HT to start an ATX heading'
    )

    t.equal(
      m('   \t> x'),
      '<pre><code>&gt; x\n</code></pre>',
      'should not support a 3*SP + HT to start a block quote'
    )

    t.equal(
      m('   \t- x'),
      '<pre><code>- x\n</code></pre>',
      'should not support a 3*SP + HT to start a list item'
    )

    t.equal(
      m('   \t---'),
      '<pre><code>---\n</code></pre>',
      'should not support a 3*SP + HT to start a thematic break'
    )

    t.equal(
      m('   \t---'),
      '<pre><code>---\n</code></pre>',
      'should not support a 3*SP + HT to start a thematic break'
    )

    t.equal(
      m('   \t```'),
      '<pre><code>```\n</code></pre>',
      'should not support a 3*SP + HT to start a fenced code'
    )

    t.equal(
      m('   \t<div>'),
      '<pre><code>&lt;div&gt;\n</code></pre>',
      'should not support a 3*SP + HT to start HTML'
    )

    t.equal(
      m('#\tx\t#\t'),
      '<h1>x</h1>',
      'should support tabs around ATX heading sequences'
    )

    t.equal(
      m('#\t\tx\t\t#\t\t'),
      '<h1>x</h1>',
      'should support arbitrary tabs around ATX heading sequences'
    )

    t.equal(
      m('```\tx\ty\t\n```\t'),
      '<pre><code class="language-x"></code></pre>',
      'should support tabs around fenced code fences, info, and meta'
    )

    t.equal(
      m('```\t\tx\t\ty\t\t\n```\t\t'),
      '<pre><code class="language-x"></code></pre>',
      'should support arbitrary tabs around fenced code fences, info, and meta'
    )

    t.equal(
      m('```x\n\t```'),
      '<pre><code class="language-x">\t```\n</code></pre>',
      'should not support tabs before fenced code closing fences'
    )

    t.equal(
      m('<x\ty\tz\t=\t"\tx\t">', {allowDangerousHtml: true}),
      '<x\ty\tz\t=\t"\tx\t">',
      'should support tabs in HTML (if whitespace is allowed)'
    )

    t.equal(m('*\t*\t*\t'), '<hr />', 'should support tabs in thematic breaks')

    t.equal(
      m('*\t\t*\t\t*\t\t'),
      '<hr />',
      'should support arbitrary tabs in thematic breaks'
    )

    t.end()
  })

  t.test('text', function (t) {
    t.equal(
      m('<http:\t>'),
      '<p>&lt;http:\t&gt;</p>',
      'should not support a tab to start an autolink w/ protocol’s rest'
    )

    t.equal(
      m('<http:x\t>'),
      '<p>&lt;http:x\t&gt;</p>',
      'should not support a tab in an autolink w/ protocol’s rest'
    )

    t.equal(
      m('<example\t@x.com>'),
      '<p>&lt;example\t@x.com&gt;</p>',
      'should not support a tab in an email autolink’s local part'
    )

    t.equal(
      m('<example@x\ty.com>'),
      '<p>&lt;example@x\ty.com&gt;</p>',
      'should not support a tab in an email autolink’s label'
    )

    t.equal(
      m('\\\tx'),
      '<p>\\\tx</p>',
      'should not support character escaped tab'
    )

    t.equal(
      m('&#9;'),
      '<p>\t</p>',
      'should support character reference resolving to a tab'
    )

    t.equal(
      m('`\tx`'),
      '<p><code>\tx</code></p>',
      'should support a tab starting code'
    )

    t.equal(
      m('`x\t`'),
      '<p><code>x\t</code></p>',
      'should support a tab ending code'
    )

    t.equal(
      m('`\tx\t`'),
      '<p><code>\tx\t</code></p>',
      'should support tabs around code'
    )

    t.equal(
      m('`\tx `'),
      '<p><code>\tx </code></p>',
      'should support a tab starting, and a space ending, code'
    )

    t.equal(
      m('` x\t`'),
      '<p><code> x\t</code></p>',
      'should support a space starting, and a tab ending, code'
    )

    // Note: CM does not strip it in this case.
    // However, that should be a bug there: makes more sense to remove it like
    // trailing spaces.
    t.equal(
      m('x\t\ny'),
      '<p>x\ny</p>',
      'should support a trailing tab at a line ending in a paragraph'
    )

    t.equal(
      m('x\n\ty'),
      '<p>x\ny</p>',
      'should support an initial tab after a line ending in a paragraph'
    )

    t.equal(
      m('x[\ty](z)'),
      '<p>x<a href="z">\ty</a></p>',
      'should support an initial tab in a link label'
    )

    t.equal(
      m('x[y\t](z)'),
      '<p>x<a href="z">y\t</a></p>',
      'should support a final tab in a link label'
    )

    t.equal(
      m('[x\ty](z)'),
      '<p><a href="z">x\ty</a></p>',
      'should support a tab in a link label'
    )

    // Note: CM.js bug, see: <https://github.com/commonmark/commonmark.js/issues/191>
    t.equal(
      m('[x](\ty)'),
      '<p><a href="y">x</a></p>',
      'should support a tab starting a link resource'
    )

    t.equal(
      m('[x](y\t)'),
      '<p><a href="y">x</a></p>',
      'should support a tab ending a link resource'
    )

    t.equal(
      m('[x](y\t"z")'),
      '<p><a href="y" title="z">x</a></p>',
      'should support a tab between a link destination and title'
    )

    t.end()
  })

  t.test('virtual spaces', function (t) {
    t.equal(
      m('```\n\tx'),
      '<pre><code>\tx\n</code></pre>',
      'should support a tab in fenced code'
    )

    t.equal(
      m(' ```\n\tx'),
      '<pre><code>   x\n</code></pre>',
      'should support strip 1 space from an initial tab in fenced code if the opening fence is indented as such'
    )

    t.equal(
      m('  ```\n\tx'),
      '<pre><code>  x\n</code></pre>',
      'should support strip 2 spaces from an initial tab in fenced code if the opening fence is indented as such'
    )

    t.equal(
      m('   ```\n\tx'),
      '<pre><code> x\n</code></pre>',
      'should support strip 3 spaces from an initial tab in fenced code if the opening fence is indented as such'
    )

    t.end()
  })

  t.end()
})
