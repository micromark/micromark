'use strict'

var test = require('tape')
var m = require('../../..')

test('setext-heading', function (t) {
  t.equal(
    m('Foo *bar*\n========='),
    '<h1>Foo <em>bar</em></h1>',
    'should support a heading w/ an equals to (rank of 1)'
  )

  t.equal(
    m('Foo *bar*\n---------'),
    '<h2>Foo <em>bar</em></h2>',
    'should support a heading w/ a dash (rank of 2)'
  )

  t.equal(
    m('Foo *bar\nbaz*\n===='),
    '<h1>Foo <em>bar\nbaz</em></h1>',
    'should support line endings in setext headings'
  )

  t.equal(
    m('  Foo *bar\nbaz*\t\n===='),
    '<h1>Foo <em>bar\nbaz</em></h1>',
    'should not include initial and final whitespace around content'
  )

  t.equal(
    m('Foo\n-------------------------'),
    '<h2>Foo</h2>',
    'should support long underlines'
  )

  t.equal(m('Foo\n='), '<h1>Foo</h1>', 'should support short underlines')

  t.equal(
    m(' Foo\n  ==='),
    '<h1>Foo</h1>',
    'should support indented content w/ 1 space'
  )

  t.equal(
    m('  Foo\n---'),
    '<h2>Foo</h2>',
    'should support indented content w/ 2 spaces'
  )

  t.equal(
    m('   Foo\n---'),
    '<h2>Foo</h2>',
    'should support indented content w/ 3 spaces'
  )

  t.equal(
    m('    Foo\n    ---'),
    '<pre><code>Foo\n---\n</code></pre>',
    'should not support too much indented content (1)'
  )

  t.equal(
    m('    Foo\n---'),
    '<pre><code>Foo\n</code></pre>\n<hr />',
    'should not support too much indented content (2)'
  )

  t.equal(
    m('Foo\n   ----      '),
    '<h2>Foo</h2>',
    'should support initial and final whitespace around the underline'
  )

  t.equal(
    m('Foo\n   ='),
    '<h1>Foo</h1>',
    'should support whitespace before underline'
  )

  t.equal(
    m('Foo\n    ='),
    '<p>Foo\n=</p>',
    'should not support too much whitespace before underline (1)'
  )

  t.equal(
    m('Foo\n\t='),
    '<p>Foo\n=</p>',
    'should not support too much whitespace before underline (2)'
  )

  t.equal(
    m('Foo\n= ='),
    '<p>Foo\n= =</p>',
    'should not support whitespace in the underline (1)'
  )

  t.equal(
    m('Foo\n--- -'),
    '<p>Foo</p>\n<hr />',
    'should not support whitespace in the underline (2)'
  )

  t.equal(
    m('Foo  \n-----'),
    '<h2>Foo</h2>',
    'should not support a hard break w/ spaces at the end'
  )

  t.equal(
    m('Foo\\\n-----'),
    '<h2>Foo\\</h2>',
    'should not support a hard break w/ backslash at the end'
  )

  t.equal(
    m('`Foo\n----\n`'),
    '<h2>`Foo</h2>\n<p>`</p>',
    'should precede over inline constructs (1)'
  )

  t.equal(
    m('<a title="a lot\n---\nof dashes"/>'),
    '<h2>&lt;a title=&quot;a lot</h2>\n<p>of dashes&quot;/&gt;</p>',
    'should precede over inline constructs (2)'
  )

  t.equal(
    m('> Foo\n---'),
    '<blockquote>\n<p>Foo</p>\n</blockquote>\n<hr />',
    'should not allow underline to be lazy (1)'
  )

  t.equal(
    m('> foo\nbar\n==='),
    '<blockquote>\n<p>foo\nbar\n===</p>\n</blockquote>',
    'should not allow underline to be lazy (2)'
  )

  // // To do: list.
  // t.equal(
  //   m('- Foo\n---'),
  //   '<ul>\n<li>Foo</li>\n</ul>\n<hr />',
  //   'should not allow underline to be lazy (3)'
  // )

  t.equal(
    m('Foo\nBar\n---'),
    '<h2>Foo\nBar</h2>',
    'should support line endings in setext headings'
  )

  t.equal(
    m('---\nFoo\n---\nBar\n---\nBaz'),
    '<hr />\n<h2>Foo</h2>\n<h2>Bar</h2>\n<p>Baz</p>',
    'should support adjacent setext headings'
  )

  t.equal(
    m('\n===='),
    '<p>====</p>',
    'should not support empty setext headings'
  )

  t.equal(
    m('---\n---'),
    '<hr />\n<hr />',
    'should prefer other constructs over setext headings (1)'
  )

  // // To do: list.
  // t.equal(
  //   m('- foo\n-----'),
  //   '<ul>\n<li>foo</li>\n</ul>\n<hr />',
  //   'should prefer other constructs over setext headings (2)'
  // )

  t.equal(
    m('    foo\n---'),
    '<pre><code>foo\n</code></pre>\n<hr />',
    'should prefer other constructs over setext headings (3)'
  )

  t.equal(
    m('> foo\n-----'),
    '<blockquote>\n<p>foo</p>\n</blockquote>\n<hr />',
    'should prefer other constructs over setext headings (4)'
  )

  t.equal(
    m('\\> foo\n------'),
    '<h2>&gt; foo</h2>',
    'should support starting w/ character escapes'
  )

  t.equal(
    m('Foo\nbar\n---\nbaz'),
    '<h2>Foo\nbar</h2>\n<p>baz</p>',
    'paragraph and heading interplay (1)'
  )

  t.equal(
    m('Foo\n\nbar\n---\nbaz'),
    '<p>Foo</p>\n<h2>bar</h2>\n<p>baz</p>',
    'paragraph and heading interplay (2)'
  )

  t.equal(
    m('Foo\nbar\n\n---\n\nbaz'),
    '<p>Foo\nbar</p>\n<hr />\n<p>baz</p>',
    'paragraph and heading interplay (3)'
  )

  t.equal(
    m('Foo\nbar\n* * *\nbaz'),
    '<p>Foo\nbar</p>\n<hr />\n<p>baz</p>',
    'paragraph and heading interplay (4)'
  )

  t.equal(
    m('Foo\nbar\n\\---\nbaz'),
    '<p>Foo\nbar\n---\nbaz</p>',
    'paragraph and heading interplay (5)'
  )

  // Our own:
  t.equal(
    m('Foo  \nbar\n-----'),
    '<h2>Foo<br />\nbar</h2>',
    'should support a hard break w/ spaces in between'
  )

  t.equal(
    m('Foo\\\nbar\n-----'),
    '<h2>Foo<br />\nbar</h2>',
    'should support a hard break w/ backslash in between'
  )

  t.end()
})
