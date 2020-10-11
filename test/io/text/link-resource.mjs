import test from 'tape'
import m from '../../../index.js'

test('link (resource)', function (t) {
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
    m('[link](<foo\nbar>)', {allowDangerousHtml: true}),
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
    m('[a](<b)c\n[a](<b)c>\n[a](<b>c)', {allowDangerousHtml: true}),
    '<p>[a](&lt;b)c\n[a](&lt;b)c&gt;\n[a](<b>c)</p>',
    'should not support links w/ unmatched enclosed destinations'
  )

  t.equal(
    m('[link](\\(foo\\))'),
    '<p><a href="(foo)">link</a></p>',
    'should support links w/ destinations w/ escaped parens'
  )

  t.equal(
    m('[link](foo(and(bar)))'),
    '<p><a href="foo(and(bar))">link</a></p>',
    'should support links w/ destinations w/ balanced parens'
  )

  t.equal(
    m('[link](foo\\(and\\(bar\\))'),
    '<p><a href="foo(and(bar)">link</a></p>',
    'should support links w/ destinations w/ escaped parens'
  )

  t.equal(
    m('[link](<foo(and(bar)>)'),
    '<p><a href="foo(and(bar)">link</a></p>',
    'should support links w/ enclosed destinations w/ parens'
  )

  t.equal(
    m('[link](foo\\)\\:)', {allowDangerousProtocol: true}),
    '<p><a href="foo):">link</a></p>',
    'should support links w/ escapes in destinations'
  )

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

  t.equal(
    m('[link](foo%20b&auml;)'),
    '<p><a href="foo%20b%C3%A4">link</a></p>',
    'should support character references in links'
  )

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

  t.equal(
    m('[link](/url "title \\"&quot;")'),
    '<p><a href="/url" title="title &quot;&quot;">link</a></p>',
    'should support character references and escapes in titles'
  )

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
    'should support whitespace around destination and title (1)'
  )

  t.equal(
    m('[link](\t\n/uri "title")'),
    '<p><a href="/uri" title="title">link</a></p>',
    'should support whitespace around destination and title (2)'
  )

  t.equal(
    m('[link](/uri  "title"\t\n)'),
    '<p><a href="/uri" title="title">link</a></p>',
    'should support whitespace around destination and title (3)'
  )

  t.equal(
    m('[link] (/uri)'),
    '<p>[link] (/uri)</p>',
    'should not support whitespace between label and resource'
  )

  t.equal(
    m('[link [foo [bar]]](/uri)'),
    '<p><a href="/uri">link [foo [bar]]</a></p>',
    'should support balanced brackets'
  )

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

  t.equal(
    m('[foo [bar](/uri)](/uri)'),
    '<p>[foo <a href="/uri">bar</a>](/uri)</p>',
    'should not support links in links (1)'
  )

  t.equal(
    m('[foo *[bar [baz](/uri)](/uri)*](/uri)'),
    '<p>[foo <em>[bar <a href="/uri">baz</a>](/uri)</em>](/uri)</p>',
    'should not support links in links (2)'
  )

  t.equal(
    m('![[[foo](uri1)](uri2)](uri3)'),
    '<p><img src="uri3" alt="[foo](uri2)" /></p>',
    'should not support links in links (3)'
  )

  t.equal(
    m('*[foo*](/uri)'),
    '<p>*<a href="/uri">foo*</a></p>',
    'should prefer links over emphasis (1)'
  )

  t.equal(
    m('[foo *bar](baz*)'),
    '<p><a href="baz*">foo *bar</a></p>',
    'should prefer links over emphasis (2)'
  )

  t.equal(
    m('*foo [bar* baz]'),
    '<p><em>foo [bar</em> baz]</p>',
    'should prefer links over emphasis (3)'
  )

  t.equal(
    m('[foo <bar attr="](baz)">', {allowDangerousHtml: true}),
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

  // Extra
  t.equal(m('[]()'), '<p><a href=""></a></p>', 'should support an empty link')

  // See: <https://github.com/commonmark/commonmark.js/issues/192>
  t.equal(
    m('[](<> "")'),
    '<p><a href=""></a></p>',
    'should ignore an empty title'
  )

  t.equal(
    m('[a](<b>"c")', {allowDangerousHtml: true}),
    '<p>[a](<b>&quot;c&quot;)</p>',
    'should require whitespace between enclosed destination and title'
  )

  t.equal(
    m('[](<'),
    '<p>[](&lt;</p>',
    'should not support an unclosed enclosed destination'
  )

  t.equal(m('[]('), '<p>[](</p>', 'should not support an unclosed destination')

  t.equal(
    m('[](\\<)'),
    '<p><a href="%3C"></a></p>',
    'should support unenclosed link destination starting w/ escapes'
  )

  t.equal(
    m('[](<\\<>)'),
    '<p><a href="%3C"></a></p>',
    'should support enclosed link destination starting w/ escapes'
  )

  t.equal(
    m('[](\\'),
    '<p>[](\\</p>',
    'should not support unenclosed link destination starting w/ an incorrect escape'
  )

  t.equal(
    m('[](<\\'),
    '<p>[](&lt;\\</p>',
    'should not support enclosed link destination starting w/ an incorrect escape'
  )

  t.equal(
    m('[](a "'),
    '<p>[](a &quot;</p>',
    'should not support an eof in a link title (1)'
  )

  t.equal(
    m("[](a '"),
    "<p>[](a '</p>",
    'should not support an eof in a link title (2)'
  )

  t.equal(
    m('[](a ('),
    '<p>[](a (</p>',
    'should not support an eof in a link title (3)'
  )

  t.equal(
    m('[](a "\\'),
    '<p>[](a &quot;\\</p>',
    'should not support an eof in a link title escape (1)'
  )

  t.equal(
    m("[](a '\\"),
    "<p>[](a '\\</p>",
    'should not support an eof in a link title escape (2)'
  )

  t.equal(
    m('[](a (\\'),
    '<p>[](a (\\</p>',
    'should not support an eof in a link title escape (3)'
  )

  t.equal(
    m('[](a "\\"")'),
    '<p><a href="a" title="&quot;"></a></p>',
    'should support a character escape to start a link title (1)'
  )

  t.equal(
    m("[](a '\\'')"),
    '<p><a href="a" title="\'"></a></p>',
    'should support a character escape to start a link title (2)'
  )

  t.equal(
    m('[](a (\\)))'),
    '<p><a href="a" title=")"></a></p>',
    'should support a character escape to start a link title (3)'
  )

  t.equal(
    m('[&amp;&copy;&](example.com/&amp;&copy;& "&amp;&copy;&")'),
    '<p><a href="example.com/&amp;%C2%A9&amp;" title="&amp;©&amp;">&amp;©&amp;</a></p>',
    'should support character references in links'
  )

  t.equal(
    m('[a](1())'),
    '<p><a href="1()">a</a></p>',
    'should support 1 set of parens'
  )

  t.equal(
    m('[a](1(2()))'),
    '<p><a href="1(2())">a</a></p>',
    'should support 2 sets of parens'
  )

  t.equal(
    m('[a](1(2(3())))'),
    '<p><a href="1(2(3()))">a</a></p>',
    'should support 3 sets of parens'
  )

  t.equal(
    m('[a](1(2(3(4()))))'),
    '<p>[a](1(2(3(4()))))</p>',
    'should not support 4 or more sets of parens'
  )

  t.equal(
    m('[a](b "\n c")'),
    '<p><a href="b" title="\nc">a</a></p>',
    'should support an eol at the start of a title'
  )

  t.equal(
    m('[a](b( "c")'),
    '<p>[a](b( &quot;c&quot;)</p>',
    'should not support whitespace when unbalanced in a raw destination'
  )

  t.equal(
    m('[a](\0)'),
    '<p><a href="%EF%BF%BD">a</a></p>',
    'should support a single NUL character as a link resource'
  )

  t.end()
})
