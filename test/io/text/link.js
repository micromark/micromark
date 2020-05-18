'use strict'

var test = require('tape')
var m = require('../../..')

test('link', function (t) {
  t.equal(
    m('[link](/uri "title")'),
    '<p><a href="/uri" title="title">link</a></p>',
    'should support links'
  )

  t.equal(
    m('[link](/uri)'),
    '<p><a href="/uri">link</a></p>',
    'should support links w/o title'
  )

  t.equal(
    m('[link]()'),
    '<p><a href="">link</a></p>',
    'should support links w/o destination'
  )

  t.equal(
    m('[link](<>)'),
    '<p><a href="">link</a></p>',
    'should support links w/ empty enclosed destination'
  )

  t.equal(
    m('[link](/my uri)'),
    '<p>[link](/my uri)</p>',
    'should not support links w/ spaces in destination'
  )

  t.equal(
    m('[link](</my uri>)'),
    '<p><a href="/my%20uri">link</a></p>',
    'should support links w/ spaces in enclosed destination'
  )

  t.equal(
    m('[link](foo\nbar)'),
    '<p>[link](foo\nbar)</p>',
    'should not support links w/ line endings in destination'
  )

  t.equal(
    m('[link](<foo\nbar>)'),
    '<p>[link](<foo\nbar>)</p>',
    'should not support links w/ line endings in enclosed destination'
  )

  t.equal(
    m('[a](<b)c>)'),
    '<p><a href="b)c">a</a></p>',
    'should support links w/ closing parens in destination'
  )

  t.equal(
    m('[link](<foo\\>)'),
    '<p>[link](&lt;foo&gt;)</p>',
    'should not support links w/ enclosed destinations w/o end'
  )

  t.equal(
    m('[a](<b)c\n[a](<b)c>\n[a](<b>c)'),
    '<p>[a](&lt;b)c\n[a](&lt;b)c&gt;\n[a](<b>c)</p>',
    'should not support links w/ unmatched enclosed destinations'
  )

  // t.equal(
  //   m('[link](\\(foo\\))'),
  //   '<p><a href="(foo)">link</a></p>',
  //   'should support links w/ destinations w/ escaped parens'
  // )

  t.equal(
    m('[link](foo(and(bar)))'),
    '<p><a href="foo(and(bar))">link</a></p>',
    'should support links w/ destinations w/ balanced parens'
  )

  // t.equal(
  //   m('[link](foo\\(and\\(bar\\))'),
  //   '<p><a href="foo(and(bar)">link</a></p>',
  //   'should support links w/ destinations w/ escaped parens'
  // )

  t.equal(
    m('[link](<foo(and(bar)>)'),
    '<p><a href="foo(and(bar)">link</a></p>',
    'should support links w/ enclosed destinations w/ parens'
  )

  // t.equal(
  //   m('[link](foo\\)\\:)'),
  //   '<p><a href="foo):">link</a></p>',
  //   'should support links w/ escapes in destinations'
  // )

  t.equal(
    m('[link](#fragment)'),
    '<p><a href="#fragment">link</a></p>',
    'should support links w/ destinations to fragments'
  )

  t.equal(
    m('[link](http://example.com#fragment)'),
    '<p><a href="http://example.com#fragment">link</a></p>',
    'should support links w/ destinations to URLs w/ fragments'
  )

  t.equal(
    m('[link](http://example.com?foo=3#frag)'),
    '<p><a href="http://example.com?foo=3#frag">link</a></p>',
    'should support links w/ destinations to URLs w/ search and fragments'
  )

  t.equal(
    m('[link](foo\\bar)'),
    '<p><a href="foo%5Cbar">link</a></p>',
    'should not support non-punctuation character escapes in links'
  )

  // t.equal(
  //   m('[link](foo%20b&auml;)'),
  //   '<p><a href="foo%20b%C3%A4">link</a></p>',
  //   'should support character references in links'
  // )

  t.equal(
    m('[link]("title")'),
    '<p><a href="%22title%22">link</a></p>',
    'should not support links w/ only a title'
  )

  t.equal(
    m('[link](/url "title")'),
    '<p><a href="/url" title="title">link</a></p>',
    'should support titles w/ double quotes'
  )

  t.equal(
    m("[link](/url 'title')"),
    '<p><a href="/url" title="title">link</a></p>',
    'should support titles w/ single quotes'
  )

  t.equal(
    m('[link](/url (title))'),
    '<p><a href="/url" title="title">link</a></p>',
    'should support titles w/ parens'
  )

  // t.equal(
  //   m('[link](/url "title \\"&quot;")'),
  //   '<p><a href="/url" title="title &quot;&quot;">link</a></p>',
  //   'should support character references and escapes in titles'
  // )

  t.equal(
    m('[link](/url "title")'),
    '<p><a href="/url%C2%A0%22title%22">link</a></p>',
    'should not support unicode whitespace between destination and title'
  )

  t.equal(
    m('[link](/url "title "and" title")'),
    '<p>[link](/url &quot;title &quot;and&quot; title&quot;)</p>',
    'should not support nested balanced quotes in title'
  )

  t.equal(
    m('[link](/url \'title "and" title\')'),
    '<p><a href="/url" title="title &quot;and&quot; title">link</a></p>',
    'should support the other quotes in titles'
  )

  t.equal(
    m('[link](   /uri\n  "title"  )'),
    '<p><a href="/uri" title="title">link</a></p>',
    'should support whitespace around destination and title'
  )

  t.equal(
    m('[link] (/uri)'),
    '<p>[link] (/uri)</p>',
    'should not support whitespace between label and information'
  )

  // t.equal(
  //   m('[link [foo [bar]]](/uri)'),
  //   '<p><a href="/uri">link [foo [bar]]</a></p>',
  //   'should support balanced brackets'
  // )

  t.equal(
    m('[link] bar](/uri)'),
    '<p>[link] bar](/uri)</p>',
    'should not support unbalanced brackets (1)'
  )

  t.equal(
    m('[link [bar](/uri)'),
    '<p>[link <a href="/uri">bar</a></p>',
    'should not support unbalanced brackets (2)'
  )

  t.equal(
    m('[link \\[bar](/uri)'),
    '<p><a href="/uri">link [bar</a></p>',
    'should support characer escapes'
  )

  t.equal(
    m('[link *foo **bar** `#`*](/uri)'),
    '<p><a href="/uri">link <em>foo <strong>bar</strong> <code>#</code></em></a></p>',
    'should support content'
  )

  t.equal(
    m('[![moon](moon.jpg)](/uri)'),
    '<p><a href="/uri"><img src="moon.jpg" alt="moon" /></a></p>',
    'should support an image as content'
  )

  // t.equal(
  //   m('[foo [bar](/uri)](/uri)'),
  //   '<p>[foo <a href="/uri">bar</a>](/uri)</p>',
  //   'should not support links in links (1)'
  // )

  // t.equal(
  //   m('[foo *[bar [baz](/uri)](/uri)*](/uri)'),
  //   '<p>[foo <em>[bar <a href="/uri">baz</a>](/uri)</em>](/uri)</p>',
  //   'should not support links in links (2)'
  // )

  // t.equal(
  //   m('![[[foo](uri1)](uri2)](uri3)'),
  //   '<p><img src="uri3" alt="[foo](uri2)" /></p>',
  //   'should not support links in links (3)'
  // )

  // t.equal(
  //   m('*[foo*](/uri)'),
  //   '<p>*<a href="/uri">foo*</a></p>',
  //   'should prefer links over emphasis (1)'
  // )

  t.equal(
    m('[foo *bar](baz*)'),
    '<p><a href="baz*">foo *bar</a></p>',
    'should prefer links over emphasis (2)'
  )

  // t.equal(
  //   m('*foo [bar* baz]'),
  //   '<p><em>foo [bar</em> baz]</p>',
  //   'should prefer links over emphasis (3)'
  // )

  t.equal(
    m('[foo <bar attr="](baz)">'),
    '<p>[foo <bar attr="](baz)"></p>',
    'should prefer HTML over links'
  )

  t.equal(
    m('[foo`](/uri)`'),
    '<p>[foo<code>](/uri)</code></p>',
    'should prefer code over links'
  )

  t.equal(
    m('[foo<http://example.com/?search=](uri)>'),
    '<p>[foo<a href="http://example.com/?search=%5D(uri)">http://example.com/?search=](uri)</a></p>',
    'should prefer autolinks over links'
  )

  t.equal(
    m('[foo<http://example.com/?search=](uri)>'),
    '<p>[foo<a href="http://example.com/?search=%5D(uri)">http://example.com/?search=](uri)</a></p>',
    'should prefer autolinks over links'
  )

  // To do: reference tests.

  t.end()
})
