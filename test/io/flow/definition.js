'use strict'

var test = require('tape')
var m = require('../../..')

test('definition', function (t) {
  t.equal(
    m('[foo]: /url "title"\n\n[foo]'),
    '<p><a href="/url" title="title">foo</a></p>',
    'should support link definitions'
  )

  // // To do: paragraph whitespace.
  // t.equal(
  //   m("   [foo]: \n      /url  \n           'the title'  \n\n[foo]"),
  //   '<p><a href="/url" title="the title">foo</a></p>',
  //   'should support whitespace around definitions'
  // )

  t.equal(
    m("[Foo*bar\\]]:my_(url) 'title (with parens)'\n\n[Foo*bar\\]]"),
    '<p><a href="my_(url)" title="title (with parens)">Foo*bar]</a></p>',
    'should support complex definitions (1)'
  )

  // // To do: paragraph whitespace.
  // t.equal(
  //   m("[Foo bar]:\n<my url>\n'title'\n\n[Foo bar]"),
  //   '<p><a href="my%20url" title="title">Foo bar</a></p>',
  //   'should support complex definitions (2)'
  // )

  t.equal(
    m("[foo]: /url '\ntitle\nline1\nline2\n'\n\n[foo]"),
    '<p><a href="/url" title="\ntitle\nline1\nline2\n">foo</a></p>',
    'should support line endings in titles'
  )

  t.equal(
    m("[foo]: /url 'title\n\nwith blank line'\n\n[foo]"),
    "<p>[foo]: /url 'title</p>\n<p>with blank line'</p>\n<p>[foo]</p>",
    'should not support blank lines in titles'
  )

  // // To do: paragraph whitespace.
  // t.equal(
  //   m('[foo]:\n/url\n\n[foo]'),
  //   '<p><a href="/url">foo</a></p>',
  //   'should support definitions w/o title'
  // )

  t.equal(
    m('[foo]:\n\n[foo]'),
    '<p>[foo]:</p>\n<p>[foo]</p>',
    'should not support definitions w/o destination'
  )

  t.equal(
    m('[foo]: <>\n\n[foo]'),
    '<p><a href="">foo</a></p>',
    'should support definitions w/ explicit empty destinations'
  )

  t.equal(
    m('[foo]: <bar>(baz)\n\n[foo]'),
    '<p>[foo]: <bar>(baz)</p>\n<p>[foo]</p>',
    'should not support definitions w/ no whitespace between destination and title'
  )

  t.equal(
    m('[foo]: /url\\bar\\*baz "foo\\"bar\\baz"\n\n[foo]'),
    '<p><a href="/url%5Cbar*baz" title="foo&quot;bar\\baz">foo</a></p>',
    'should support escapes in destinations and titles'
  )

  // // To do: order.
  // t.equal(
  //   m('[foo]\n\n[foo]: url'),
  //   '<p><a href="/url%5Cbar*baz" title="foo&quot;bar\\baz">foo</a></p>',
  //   'should support escapes in destinations and titles'
  // )

  t.equal(
    m('[foo]: first\n[foo]: second\n\n[foo]'),
    '<p><a href="first">foo</a></p>',
    'should match w/ the first definition'
  )

  t.equal(
    m('[FOO]: /url\n\n[Foo]'),
    '<p><a href="/url">Foo</a></p>',
    'should match w/ case-insensitive (1)'
  )

  t.equal(
    m('[ΑΓΩ]: /φου\n\n[αγω]'),
    '<p><a href="/%CF%86%CE%BF%CF%85">αγω</a></p>',
    'should match w/ case-insensitive (2)'
  )

  t.equal(
    m('[foo]: /url'),
    '',
    'should not contribute anything w/o reference (1)'
  )

  // // To do: whitespace.
  // t.equal(
  //   m('[\nfoo\n]: /url\nbar'),
  //   '<p>bar</p>',
  //   'should not contribute anything w/o reference (2)'
  // )

  t.equal(
    m('[foo]: /url "title" ok'),
    '<p>[foo]: /url &quot;title&quot; ok</p>',
    'should not support non-whitespace content after definitions (1)'
  )

  t.equal(
    m('[foo]: /url\n"title" ok'),
    '<p>&quot;title&quot; ok</p>',
    'should not support non-whitespace content after definitions (2)'
  )

  t.equal(
    m('    [foo]: /url "title"\n\n[foo]'),
    '<pre><code>[foo]: /url &quot;title&quot;\n</code></pre>\n<p>[foo]</p>',
    'should prefer indented code over definitions'
  )

  t.equal(
    m('```\n[foo]: /url\n```\n\n[foo]'),
    '<pre><code>[foo]: /url\n</code></pre>\n<p>[foo]</p>',
    'should not support definitions in fenced code'
  )

  t.equal(
    m('Foo\n[bar]: /baz\n\n[bar]'),
    '<p>Foo\n[bar]: /baz</p>\n<p>[bar]</p>',
    'should not support definitions in paragraphs'
  )

  // // To do: block quote
  // // To do: order.
  // t.equal(
  //   m('# [Foo]\n[foo]: /url\n> bar'),
  //   '<h1><a href="/url">Foo</a></h1>\n<blockquote>\n<p>bar</p>\n</blockquote>',
  //   'should not support definitions in paragraphs'
  // )

  t.equal(
    m('[foo]: /url\nbar\n===\n[foo]'),
    '<h1>bar</h1>\n<p><a href="/url">foo</a></p>',
    'should support setext headings after definitions'
  )

  t.equal(
    m('[foo]: /url\n===\n[foo]'),
    '<p>===\n<a href="/url">foo</a></p>',
    'should not support setext heading underlines after definitions'
  )

  // // To do: whitespace
  // t.equal(
  //   m(
  //     '[foo]: /foo-url "foo"\n[bar]: /bar-url\n  "bar"\n[baz]: /baz-url\n\n[foo],\n[bar],\n[baz]'
  //   ),
  //   '<p><a href="/foo-url" title="foo">foo</a>,\n<a href="/bar-url" title="bar">bar</a>,\n<a href="/baz-url">baz</a></p>',
  //   'should support definitions after definitions'
  // )

  // // To do: block quote
  // t.equal(
  //   m('> [foo]: /url\n\n[foo]'),
  //   '<blockquote>\n</blockquote>\n<p><a href="/url">foo</a></p>',
  //   'should support definitions in block quotes'
  // )

  t.end()
})
