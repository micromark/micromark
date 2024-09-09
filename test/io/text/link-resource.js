import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('link (resource)', async function (t) {
  await t.test('should support links', async function () {
    assert.equal(
      micromark('[link](/uri "title")'),
      '<p><a href="/uri" title="title">link</a></p>'
    )
  })

  await t.test('should support links w/o title', async function () {
    assert.equal(micromark('[link](/uri)'), '<p><a href="/uri">link</a></p>')
  })

  await t.test('should support links w/o destination', async function () {
    assert.equal(micromark('[link]()'), '<p><a href="">link</a></p>')
  })

  await t.test(
    'should support links w/ empty enclosed destination',
    async function () {
      assert.equal(micromark('[link](<>)'), '<p><a href="">link</a></p>')
    }
  )

  await t.test(
    'should not support links w/ spaces in destination',
    async function () {
      assert.equal(micromark('[link](/my uri)'), '<p>[link](/my uri)</p>')
    }
  )

  await t.test(
    'should support links w/ spaces in enclosed destination',
    async function () {
      assert.equal(
        micromark('[link](</my uri>)'),
        '<p><a href="/my%20uri">link</a></p>'
      )
    }
  )

  await t.test(
    'should not support links w/ line endings in destination',
    async function () {
      assert.equal(micromark('[link](foo\nbar)'), '<p>[link](foo\nbar)</p>')
    }
  )

  await t.test(
    'should not support links w/ line endings in enclosed destination',
    async function () {
      assert.equal(
        micromark('[link](<foo\nbar>)', {allowDangerousHtml: true}),
        '<p>[link](<foo\nbar>)</p>'
      )
    }
  )

  await t.test(
    'should support links w/ closing parens in destination',
    async function () {
      assert.equal(micromark('[a](<b)c>)'), '<p><a href="b)c">a</a></p>')
    }
  )

  await t.test(
    'should not support links w/ enclosed destinations w/o end',
    async function () {
      assert.equal(micromark('[link](<foo\\>)'), '<p>[link](&lt;foo&gt;)</p>')
    }
  )

  await t.test(
    'should not support links w/ unmatched enclosed destinations',
    async function () {
      assert.equal(
        micromark('[a](<b)c\n[a](<b)c>\n[a](<b>c)', {allowDangerousHtml: true}),
        '<p>[a](&lt;b)c\n[a](&lt;b)c&gt;\n[a](<b>c)</p>'
      )
    }
  )

  await t.test(
    'should support links w/ destinations w/ escaped parens',
    async function () {
      assert.equal(
        micromark('[link](\\(foo\\))'),
        '<p><a href="(foo)">link</a></p>'
      )
    }
  )

  await t.test(
    'should support links w/ destinations w/ balanced parens',
    async function () {
      assert.equal(
        micromark('[link](foo(and(bar)))'),
        '<p><a href="foo(and(bar))">link</a></p>'
      )
    }
  )

  await t.test(
    'should support links w/ destinations w/ escaped parens',
    async function () {
      assert.equal(
        micromark('[link](foo\\(and\\(bar\\))'),
        '<p><a href="foo(and(bar)">link</a></p>'
      )
    }
  )

  await t.test(
    'should support links w/ enclosed destinations w/ parens',
    async function () {
      assert.equal(
        micromark('[link](<foo(and(bar)>)'),
        '<p><a href="foo(and(bar)">link</a></p>'
      )
    }
  )

  await t.test(
    'should support links w/ escapes in destinations',
    async function () {
      assert.equal(
        micromark('[link](foo\\)\\:)', {allowDangerousProtocol: true}),
        '<p><a href="foo):">link</a></p>'
      )
    }
  )

  await t.test(
    'should support links w/ destinations to fragments',
    async function () {
      assert.equal(
        micromark('[link](#fragment)'),
        '<p><a href="#fragment">link</a></p>'
      )
    }
  )

  await t.test(
    'should support links w/ destinations to URLs w/ fragments',
    async function () {
      assert.equal(
        micromark('[link](http://example.com#fragment)'),
        '<p><a href="http://example.com#fragment">link</a></p>'
      )
    }
  )

  await t.test(
    'should support links w/ destinations to URLs w/ search and fragments',
    async function () {
      assert.equal(
        micromark('[link](http://example.com?foo=3#frag)'),
        '<p><a href="http://example.com?foo=3#frag">link</a></p>'
      )
    }
  )

  await t.test(
    'should not support non-punctuation character escapes in links',
    async function () {
      assert.equal(
        micromark('[link](foo\\bar)'),
        '<p><a href="foo%5Cbar">link</a></p>'
      )
    }
  )

  await t.test(
    'should support character references in links',
    async function () {
      assert.equal(
        micromark('[link](foo%20b&auml;)'),
        '<p><a href="foo%20b%C3%A4">link</a></p>'
      )
    }
  )

  await t.test('should not support links w/ only a title', async function () {
    assert.equal(
      micromark('[link]("title")'),
      '<p><a href="%22title%22">link</a></p>'
    )
  })

  await t.test('should support titles w/ double quotes', async function () {
    assert.equal(
      micromark('[link](/url "title")'),
      '<p><a href="/url" title="title">link</a></p>'
    )
  })

  await t.test('should support titles w/ single quotes', async function () {
    assert.equal(
      micromark("[link](/url 'title')"),
      '<p><a href="/url" title="title">link</a></p>'
    )
  })

  await t.test('should support titles w/ parens', async function () {
    assert.equal(
      micromark('[link](/url (title))'),
      '<p><a href="/url" title="title">link</a></p>'
    )
  })

  await t.test(
    'should support character references and escapes in titles',
    async function () {
      assert.equal(
        micromark('[link](/url "title \\"&quot;")'),
        '<p><a href="/url" title="title &quot;&quot;">link</a></p>'
      )
    }
  )

  await t.test(
    'should not support unicode whitespace between destination and title',
    async function () {
      assert.equal(
        micromark('[link](/url "title")'),
        '<p><a href="/url%C2%A0%22title%22">link</a></p>'
      )
    }
  )

  await t.test(
    'should not support nested balanced quotes in title',
    async function () {
      assert.equal(
        micromark('[link](/url "title "and" title")'),
        '<p>[link](/url &quot;title &quot;and&quot; title&quot;)</p>'
      )
    }
  )

  await t.test('should support the other quotes in titles', async function () {
    assert.equal(
      micromark('[link](/url \'title "and" title\')'),
      '<p><a href="/url" title="title &quot;and&quot; title">link</a></p>'
    )
  })

  await t.test(
    'should support whitespace around destination and title (1)',
    async function () {
      assert.equal(
        micromark('[link](   /uri\n  "title"  )'),
        '<p><a href="/uri" title="title">link</a></p>'
      )
    }
  )

  await t.test(
    'should support whitespace around destination and title (2)',
    async function () {
      assert.equal(
        micromark('[link](\t\n/uri "title")'),
        '<p><a href="/uri" title="title">link</a></p>'
      )
    }
  )

  await t.test(
    'should support whitespace around destination and title (3)',
    async function () {
      assert.equal(
        micromark('[link](/uri  "title"\t\n)'),
        '<p><a href="/uri" title="title">link</a></p>'
      )
    }
  )

  await t.test(
    'should not support whitespace between label and resource',
    async function () {
      assert.equal(micromark('[link] (/uri)'), '<p>[link] (/uri)</p>')
    }
  )

  await t.test('should support balanced brackets', async function () {
    assert.equal(
      micromark('[link [foo [bar]]](/uri)'),
      '<p><a href="/uri">link [foo [bar]]</a></p>'
    )
  })

  await t.test('should not support unbalanced brackets (1)', async function () {
    assert.equal(micromark('[link] bar](/uri)'), '<p>[link] bar](/uri)</p>')
  })

  await t.test('should not support unbalanced brackets (2)', async function () {
    assert.equal(
      micromark('[link [bar](/uri)'),
      '<p>[link <a href="/uri">bar</a></p>'
    )
  })

  await t.test('should support characer escapes', async function () {
    assert.equal(
      micromark('[link \\[bar](/uri)'),
      '<p><a href="/uri">link [bar</a></p>'
    )
  })

  await t.test('should support content', async function () {
    assert.equal(
      micromark('[link *foo **bar** `#`*](/uri)'),
      '<p><a href="/uri">link <em>foo <strong>bar</strong> <code>#</code></em></a></p>'
    )
  })

  await t.test('should support an image as content', async function () {
    assert.equal(
      micromark('[![moon](moon.jpg)](/uri)'),
      '<p><a href="/uri"><img src="moon.jpg" alt="moon" /></a></p>'
    )
  })

  await t.test('should not support links in links (1)', async function () {
    assert.equal(
      micromark('[foo [bar](/uri)](/uri)'),
      '<p>[foo <a href="/uri">bar</a>](/uri)</p>'
    )
  })

  await t.test('should not support links in links (2)', async function () {
    assert.equal(
      micromark('[foo *[bar [baz](/uri)](/uri)*](/uri)'),
      '<p>[foo <em>[bar <a href="/uri">baz</a>](/uri)</em>](/uri)</p>'
    )
  })

  await t.test('should not support links in links (3)', async function () {
    assert.equal(
      micromark('![[[foo](uri1)](uri2)](uri3)'),
      '<p><img src="uri3" alt="[foo](uri2)" /></p>'
    )
  })

  await t.test('should prefer links over emphasis (1)', async function () {
    assert.equal(micromark('*[foo*](/uri)'), '<p>*<a href="/uri">foo*</a></p>')
  })

  await t.test('should prefer links over emphasis (2)', async function () {
    assert.equal(
      micromark('[foo *bar](baz*)'),
      '<p><a href="baz*">foo *bar</a></p>'
    )
  })

  await t.test('should prefer links over emphasis (3)', async function () {
    assert.equal(micromark('*foo [bar* baz]'), '<p><em>foo [bar</em> baz]</p>')
  })

  await t.test('should prefer HTML over links', async function () {
    assert.equal(
      micromark('[foo <bar attr="](baz)">', {allowDangerousHtml: true}),
      '<p>[foo <bar attr="](baz)"></p>'
    )
  })

  await t.test('should prefer code over links', async function () {
    assert.equal(micromark('[foo`](/uri)`'), '<p>[foo<code>](/uri)</code></p>')
  })

  await t.test('should prefer autolinks over links', async function () {
    assert.equal(
      micromark('[foo<http://example.com/?search=](uri)>'),
      '<p>[foo<a href="http://example.com/?search=%5D(uri)">http://example.com/?search=](uri)</a></p>'
    )
  })

  await t.test('should prefer autolinks over links', async function () {
    assert.equal(
      micromark('[foo<http://example.com/?search=](uri)>'),
      '<p>[foo<a href="http://example.com/?search=%5D(uri)">http://example.com/?search=](uri)</a></p>'
    )
  })

  await t.test('should support an empty link', async function () {
    // Extra
    assert.equal(micromark('[]()'), '<p><a href=""></a></p>')
  })

  await t.test('should ignore an empty title', async function () {
    // See: <https://github.com/commonmark/commonmark.js/issues/192>
    assert.equal(micromark('[](<> "")'), '<p><a href=""></a></p>')
  })

  await t.test(
    'should require whitespace between enclosed destination and title',
    async function () {
      assert.equal(
        micromark('[a](<b>"c")', {allowDangerousHtml: true}),
        '<p>[a](<b>&quot;c&quot;)</p>'
      )
    }
  )

  await t.test(
    'should not support an unclosed enclosed destination',
    async function () {
      assert.equal(micromark('[](<'), '<p>[](&lt;</p>')
    }
  )

  await t.test('should not support an unclosed destination', async function () {
    assert.equal(micromark('[]('), '<p>[](</p>')
  })

  await t.test(
    'should support unenclosed link destination starting w/ escapes',
    async function () {
      assert.equal(micromark('[](\\<)'), '<p><a href="%3C"></a></p>')
    }
  )

  await t.test(
    'should support enclosed link destination starting w/ escapes',
    async function () {
      assert.equal(micromark('[](<\\<>)'), '<p><a href="%3C"></a></p>')
    }
  )

  await t.test(
    'should not support unenclosed link destination starting w/ an incorrect escape',
    async function () {
      assert.equal(micromark('[](\\'), '<p>[](\\</p>')
    }
  )

  await t.test(
    'should not support enclosed link destination starting w/ an incorrect escape',
    async function () {
      assert.equal(micromark('[](<\\'), '<p>[](&lt;\\</p>')
    }
  )

  await t.test(
    'should not support an eof in a link title (1)',
    async function () {
      assert.equal(micromark('[](a "'), '<p>[](a &quot;</p>')
    }
  )

  await t.test(
    'should not support an eof in a link title (2)',
    async function () {
      assert.equal(micromark("[](a '"), "<p>[](a '</p>")
    }
  )

  await t.test(
    'should not support an eof in a link title (3)',
    async function () {
      assert.equal(micromark('[](a ('), '<p>[](a (</p>')
    }
  )

  await t.test(
    'should not support an eof in a link title escape (1)',
    async function () {
      assert.equal(micromark('[](a "\\'), '<p>[](a &quot;\\</p>')
    }
  )

  await t.test(
    'should not support an eof in a link title escape (2)',
    async function () {
      assert.equal(micromark("[](a '\\"), "<p>[](a '\\</p>")
    }
  )

  await t.test(
    'should not support an eof in a link title escape (3)',
    async function () {
      assert.equal(micromark('[](a (\\'), '<p>[](a (\\</p>')
    }
  )

  await t.test(
    'should support a character escape to start a link title (1)',
    async function () {
      assert.equal(
        micromark('[](a "\\"")'),
        '<p><a href="a" title="&quot;"></a></p>'
      )
    }
  )

  await t.test(
    'should support a character escape to start a link title (2)',
    async function () {
      assert.equal(
        micromark("[](a '\\'')"),
        '<p><a href="a" title="\'"></a></p>'
      )
    }
  )

  await t.test(
    'should support a character escape to start a link title (3)',
    async function () {
      assert.equal(
        micromark('[](a (\\)))'),
        '<p><a href="a" title=")"></a></p>'
      )
    }
  )

  await t.test(
    'should support character references in links',
    async function () {
      assert.equal(
        micromark('[&amp;&copy;&](example.com/&amp;&copy;& "&amp;&copy;&")'),
        '<p><a href="example.com/&amp;%C2%A9&amp;" title="&amp;©&amp;">&amp;©&amp;</a></p>'
      )
    }
  )

  await t.test('should support 1 set of parens', async function () {
    assert.equal(micromark('[a](1())'), '<p><a href="1()">a</a></p>')
  })

  await t.test('should support 2 sets of parens', async function () {
    assert.equal(micromark('[a](1(2()))'), '<p><a href="1(2())">a</a></p>')
  })

  await t.test('should support 32 sets of parens', async function () {
    assert.equal(
      micromark(
        '[a](1(2(3(4(5(6(7(8(9(10(11(12(13(14(15(16(17(18(19(20(21(22(23(24(25(26(27(28(29(30(31(32()))))))))))))))))))))))))))))))))'
      ),
      '<p><a href="1(2(3(4(5(6(7(8(9(10(11(12(13(14(15(16(17(18(19(20(21(22(23(24(25(26(27(28(29(30(31(32())))))))))))))))))))))))))))))))">a</a></p>'
    )
  })

  await t.test(
    'should not support 33 or more sets of parens',
    async function () {
      assert.equal(
        micromark(
          '[a](1(2(3(4(5(6(7(8(9(10(11(12(13(14(15(16(17(18(19(20(21(22(23(24(25(26(27(28(29(30(31(32(33())))))))))))))))))))))))))))))))))'
        ),
        '<p>[a](1(2(3(4(5(6(7(8(9(10(11(12(13(14(15(16(17(18(19(20(21(22(23(24(25(26(27(28(29(30(31(32(33())))))))))))))))))))))))))))))))))</p>'
      )
    }
  )

  await t.test(
    'should support an eol at the start of a title',
    async function () {
      assert.equal(
        micromark('[a](b "\n c")'),
        '<p><a href="b" title="\nc">a</a></p>'
      )
    }
  )

  await t.test(
    'should not support whitespace when unbalanced in a raw destination',
    async function () {
      assert.equal(micromark('[a](b( "c")'), '<p>[a](b( &quot;c&quot;)</p>')
    }
  )

  await t.test(
    'should support a single NUL character as a link resource',
    async function () {
      assert.equal(micromark('[a](\0)'), '<p><a href="%EF%BF%BD">a</a></p>')
    }
  )
})
