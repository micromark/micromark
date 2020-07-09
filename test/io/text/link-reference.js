'use strict'

var test = require('tape')
var m = require('../../..')

test('link (reference)', function (t) {
  t.equal(
    m('[bar]: /url "title"\n\n[foo][bar]'),
    '<p><a href="/url" title="title">foo</a></p>',
    'should support link references'
  )

  // // To do: ???
  // t.equal(
  //   m('[ref]: /uri\n\n[link [foo [bar]]][ref]'),
  //   '<p><a href="/uri">link [foo [bar]]</a></p>',
  //   'should support balanced braces in link references'
  // )

  t.equal(
    m('[ref]: /uri\n\n[link \\[bar][ref]'),
    '<p><a href="/uri">link [bar</a></p>',
    'should support escaped braces in link references'
  )

  t.equal(
    m('[ref]: /uri\n\n[link *foo **bar** `#`*][ref]'),
    '<p><a href="/uri">link <em>foo <strong>bar</strong> <code>#</code></em></a></p>',
    'should support content in link references'
  )

  t.equal(
    m('[ref]: /uri\n\n[![moon](moon.jpg)][ref]'),
    '<p><a href="/uri"><img src="moon.jpg" alt="moon" /></a></p>',
    'should support images in link references'
  )

  t.equal(
    m('[ref]: /uri\n\n[foo [bar](/uri)][ref]'),
    '<p>[foo <a href="/uri">bar</a>]<a href="/uri">ref</a></p>',
    'should not support links in link references'
  )

  t.equal(
    m('[ref]: /uri\n\n[foo *bar [baz][ref]*][ref]'),
    '<p>[foo <em>bar <a href="/uri">baz</a></em>]<a href="/uri">ref</a></p>',
    'should not support deep links in link references'
  )

  // // To do: break emphasis
  // t.equal(
  //   m('[ref]: /uri\n\n*[foo*][ref]'),
  //   '<p>*<a href="/uri">foo*</a></p>',
  //   'should prefer link references over emphasis (1)'
  // )

  t.equal(
    m('[ref]: /uri\n\n[foo *bar][ref]'),
    '<p><a href="/uri">foo *bar</a></p>',
    'should prefer link references over emphasis (2)'
  )

  t.equal(
    m('[ref]: /uri\n\n[foo <bar attr="][ref]">'),
    '<p>[foo <bar attr="][ref]"></p>',
    'should prefer HTML over link references'
  )

  t.equal(
    m('[ref]: /uri\n\n[foo`][ref]`'),
    '<p>[foo<code>][ref]</code></p>',
    'should prefer code over link references'
  )

  t.equal(
    m('[ref]: /uri\n\n[foo<http://example.com/?search=][ref]>'),
    '<p>[foo<a href="http://example.com/?search=%5D%5Bref%5D">http://example.com/?search=][ref]</a></p>',
    'should prefer autolinks over link references'
  )

  t.equal(
    m('[bar]: /url "title"\n\n[foo][BaR]'),
    '<p><a href="/url" title="title">foo</a></p>',
    'should match references to definitions case-insensitively'
  )

  t.equal(
    m('[ТОЛПОЙ]: /url\n\n[Толпой][Толпой] is a Russian word.'),
    '<p><a href="/url">Толпой</a> is a Russian word.</p>',
    'should match references to definitions w/ unicode case-folding'
  )

  t.equal(
    m('[Foo\n  bar]: /url\n\n[Baz][Foo bar]'),
    '<p><a href="/url">Baz</a></p>',
    'should match references to definitions w/ collapsing'
  )

  t.equal(
    m('[bar]: /url "title"\n\n[foo] [bar]'),
    '<p>[foo] <a href="/url" title="title">bar</a></p>',
    'should not support whitespace between label and reference (1)'
  )

  t.equal(
    m('[bar]: /url "title"\n\n[foo]\n[bar]'),
    '<p>[foo]\n<a href="/url" title="title">bar</a></p>',
    'should not support whitespace between label and reference (2)'
  )

  t.equal(
    m('[foo]: /url1\n\n[foo]: /url2\n\n[bar][foo]'),
    '<p><a href="/url1">bar</a></p>',
    'should prefer earlier definitions'
  )

  // // To do: <https://github.com/commonmark/commonmark-spec/issues/616>
  // t.equal(
  //   m('[foo!]: /url\n\n[bar][foo\\!]'),
  //   '<p>[bar][foo!]</p>',
  //   'should not match references to definitions w/ escapes'
  // )

  t.equal(
    m('[ref[]: /uri\n\n[foo][ref[]'),
    '<p>[ref[]: /uri</p>\n<p>[foo][ref[]</p>',
    'should not support references w/ braces (1)'
  )

  t.equal(
    m('[ref[bar]]: /uri\n\n[foo][ref[bar]]'),
    '<p>[ref[bar]]: /uri</p>\n<p>[foo][ref[bar]]</p>',
    'should not support references w/ braces (2)'
  )

  t.equal(
    m('[[[foo]]]: /url\n\n[[[foo]]]'),
    '<p>[[[foo]]]: /url</p>\n<p>[[[foo]]]</p>',
    'should not support references w/ braces (3)'
  )

  t.equal(
    m('[ref\\[]: /uri\n\n[foo][ref\\[]'),
    '<p><a href="/uri">foo</a></p>',
    'should match references to definitions w/ matching escapes'
  )

  t.equal(
    m('[bar\\\\]: /uri\n\n[bar\\\\]'),
    '<p><a href="/uri">bar\\</a></p>',
    'should support escapes'
  )

  t.equal(
    m('[]: /uri\n\n[]'),
    '<p>[]: /uri</p>\n<p>[]</p>',
    'should not support empty references (1)'
  )

  // // To do: whitespace
  // t.equal(
  //   m('[\n ]: /uri\n\n[\n ]'),
  //   '<p>[\n]: /uri</p>\n<p>[\n]</p>',
  //   'should not support empty references (2)'
  // )

  t.equal(
    m('[foo]: /url "title"\n\n[foo][]'),
    '<p><a href="/url" title="title">foo</a></p>',
    'should support collaped references'
  )

  // // To do: ???
  // t.equal(
  //   m('[*foo* bar]: /url "title"\n\n[*foo* bar][]'),
  //   '<p><a href="/url" title="title"><em>foo</em> bar</a></p>',
  //   'should support content in collaped references'
  // )

  t.equal(
    m('[foo]: /url "title"\n\n[Foo][]'),
    '<p><a href="/url" title="title">Foo</a></p>',
    'should match references to definitions case-insensitively'
  )

  t.equal(
    m('[foo]: /url "title"\n\n[foo] \n[]'),
    '<p><a href="/url" title="title">foo</a>\n[]</p>',
    'should not support whitespace between label and collaped reference'
  )

  t.equal(
    m('[foo]: /url "title"\n\n[foo]'),
    '<p><a href="/url" title="title">foo</a></p>',
    'should support shortcut references'
  )

  // // To do: content.
  // t.equal(
  //   m('[*foo* bar]: /url "title"\n\n[*foo* bar]'),
  //   '<p><a href="/url" title="title"><em>foo</em> bar</a></p>',
  //   'should support content in shortcut references (1)'
  // )

  // // To do: content.
  // t.equal(
  //   m('[*foo* bar]: /url "title"\n\n[[*foo* bar]]'),
  //   '<p>[<a href="/url" title="title"><em>foo</em> bar</a>]</p>',
  //   'should support content in shortcut references (2)'
  // )

  t.equal(
    m('[foo]: /url\n\n[[bar [foo]'),
    '<p>[[bar <a href="/url">foo</a></p>',
    'should support content in shortcut references (3)'
  )

  t.equal(
    m('[foo]: /url "title"\n\n[Foo]'),
    '<p><a href="/url" title="title">Foo</a></p>',
    'should match shortcut references to definitions case-insensitively'
  )

  t.equal(
    m('[foo]: /url\n\n[foo] bar'),
    '<p><a href="/url">foo</a> bar</p>',
    'should support whitespace after a shortcut reference'
  )

  t.equal(
    m('[foo]: /url\n\n[foo] bar'),
    '<p><a href="/url">foo</a> bar</p>',
    'should support whitespace after a shortcut reference'
  )

  t.equal(
    m('[foo]: /url "title"\n\n\\[foo]'),
    '<p>[foo]</p>',
    'should support an escaped shortcut reference'
  )

  // // To do: break emphasis
  // t.equal(
  //   m('[foo*]: /url\n\n*[foo*]'),
  //   '<p>*<a href="/url">foo*</a></p>',
  //   'should prefer shortcut references over emphasis'
  // )

  t.equal(
    m('[foo]: /url1\n[bar]: /url2\n\n[foo][bar]'),
    '<p><a href="/url2">foo</a></p>',
    'should prefer full references over shortcut references'
  )

  t.equal(
    m('[foo]: /url1\n\n[foo][]'),
    '<p><a href="/url1">foo</a></p>',
    'should prefer collapsed references over shortcut references'
  )

  t.equal(
    m('[foo]: /url1\n\n[foo]()'),
    '<p><a href="">foo</a></p>',
    'should prefer resources over shortcut references'
  )

  t.equal(
    m('[foo]: /url1\n\n[foo](not a link)'),
    '<p><a href="/url1">foo</a>(not a link)</p>',
    'should support shortcut references when followed by nonconforming resources'
  )

  // // To do: stable/unstable.
  // t.equal(
  //   m('[baz]: /url\n\n[foo][bar][baz]'),
  //   '<p>[foo]<a href="/url">bar</a></p>',
  //   'stable/unstable (1)'
  // )

  t.equal(
    m('[baz]: /url1\n[bar]: /url2\n\n[foo][bar][baz]'),
    '<p><a href="/url2">foo</a><a href="/url1">baz</a></p>',
    'stable/unstable (2)'
  )

  // // To do: stable/unstable.
  // t.equal(
  //   m('[baz]: /url1\n[foo]: /url2\n\n[foo][bar][baz]'),
  //   '<p>[foo]<a href="/url1">bar</a></p>',
  //   'stable/unstable (3)'
  // )

  t.end()
})
