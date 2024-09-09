import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('link (reference)', async function (t) {
  await t.test('should support link references', async function () {
    assert.equal(
      micromark('[bar]: /url "title"\n\n[foo][bar]'),
      '<p><a href="/url" title="title">foo</a></p>'
    )
  })

  await t.test(
    'should support balanced brackets in link references',
    async function () {
      assert.equal(
        micromark('[ref]: /uri\n\n[link [foo [bar]]][ref]'),
        '<p><a href="/uri">link [foo [bar]]</a></p>'
      )
    }
  )

  await t.test(
    'should support escaped brackets in link references',
    async function () {
      assert.equal(
        micromark('[ref]: /uri\n\n[link \\[bar][ref]'),
        '<p><a href="/uri">link [bar</a></p>'
      )
    }
  )

  await t.test('should support content in link references', async function () {
    assert.equal(
      micromark('[ref]: /uri\n\n[link *foo **bar** `#`*][ref]'),
      '<p><a href="/uri">link <em>foo <strong>bar</strong> <code>#</code></em></a></p>'
    )
  })

  await t.test('should support images in link references', async function () {
    assert.equal(
      micromark('[ref]: /uri\n\n[![moon](moon.jpg)][ref]'),
      '<p><a href="/uri"><img src="moon.jpg" alt="moon" /></a></p>'
    )
  })

  await t.test(
    'should not support links in link references',
    async function () {
      assert.equal(
        micromark('[ref]: /uri\n\n[foo [bar](/uri)][ref]'),
        '<p>[foo <a href="/uri">bar</a>]<a href="/uri">ref</a></p>'
      )
    }
  )

  await t.test(
    'should not support deep links in link references',
    async function () {
      assert.equal(
        micromark('[ref]: /uri\n\n[foo *bar [baz][ref]*][ref]'),
        '<p>[foo <em>bar <a href="/uri">baz</a></em>]<a href="/uri">ref</a></p>'
      )
    }
  )

  await t.test(
    'should prefer link references over emphasis (1)',
    async function () {
      assert.equal(
        micromark('[ref]: /uri\n\n*[foo*][ref]'),
        '<p>*<a href="/uri">foo*</a></p>'
      )
    }
  )

  await t.test(
    'should prefer link references over emphasis (2)',
    async function () {
      assert.equal(
        micromark('[ref]: /uri\n\n[foo *bar][ref]'),
        '<p><a href="/uri">foo *bar</a></p>'
      )
    }
  )

  await t.test('should prefer HTML over link references', async function () {
    assert.equal(
      micromark('[ref]: /uri\n\n[foo <bar attr="][ref]">', {
        allowDangerousHtml: true
      }),
      '<p>[foo <bar attr="][ref]"></p>'
    )
  })

  await t.test('should prefer code over link references', async function () {
    assert.equal(
      micromark('[ref]: /uri\n\n[foo`][ref]`'),
      '<p>[foo<code>][ref]</code></p>'
    )
  })

  await t.test(
    'should prefer autolinks over link references',
    async function () {
      assert.equal(
        micromark('[ref]: /uri\n\n[foo<http://example.com/?search=][ref]>'),
        '<p>[foo<a href="http://example.com/?search=%5D%5Bref%5D">http://example.com/?search=][ref]</a></p>'
      )
    }
  )

  await t.test(
    'should match references to definitions case-insensitively',
    async function () {
      assert.equal(
        micromark('[bar]: /url "title"\n\n[foo][BaR]'),
        '<p><a href="/url" title="title">foo</a></p>'
      )
    }
  )

  await t.test(
    'should match references to definitions w/ unicode case-folding',
    async function () {
      assert.equal(
        micromark('[ТОЛПОЙ]: /url\n\n[Толпой][Толпой] is a Russian word.'),
        '<p><a href="/url">Толпой</a> is a Russian word.</p>'
      )
    }
  )

  await t.test(
    'should match references to definitions w/ collapsing',
    async function () {
      assert.equal(
        micromark('[Foo\n  bar]: /url\n\n[Baz][Foo bar]'),
        '<p><a href="/url">Baz</a></p>'
      )
    }
  )

  await t.test(
    'should not support whitespace between label and reference (1)',
    async function () {
      assert.equal(
        micromark('[bar]: /url "title"\n\n[foo] [bar]'),
        '<p>[foo] <a href="/url" title="title">bar</a></p>'
      )
    }
  )

  await t.test(
    'should not support whitespace between label and reference (2)',
    async function () {
      assert.equal(
        micromark('[bar]: /url "title"\n\n[foo]\n[bar]'),
        '<p>[foo]\n<a href="/url" title="title">bar</a></p>'
      )
    }
  )

  await t.test('should prefer earlier definitions', async function () {
    assert.equal(
      micromark('[foo]: /url1\n\n[foo]: /url2\n\n[bar][foo]'),
      '<p><a href="/url1">bar</a></p>'
    )
  })

  await t.test(
    'should not match references to definitions w/ escapes',
    async function () {
      assert.equal(
        micromark('[foo!]: /url\n\n[bar][foo\\!]'),
        '<p>[bar][foo!]</p>'
      )
    }
  )

  await t.test(
    'should not support references w/ brackets (1)',
    async function () {
      assert.equal(
        micromark('[ref[]: /uri\n\n[foo][ref[]'),
        '<p>[ref[]: /uri</p>\n<p>[foo][ref[]</p>'
      )
    }
  )

  await t.test(
    'should not support references w/ brackets (2)',
    async function () {
      assert.equal(
        micromark('[ref[bar]]: /uri\n\n[foo][ref[bar]]'),
        '<p>[ref[bar]]: /uri</p>\n<p>[foo][ref[bar]]</p>'
      )
    }
  )

  await t.test(
    'should not support references w/ brackets (3)',
    async function () {
      assert.equal(
        micromark('[[[foo]]]: /url\n\n[[[foo]]]'),
        '<p>[[[foo]]]: /url</p>\n<p>[[[foo]]]</p>'
      )
    }
  )

  await t.test(
    'should match references to definitions w/ matching escapes',
    async function () {
      assert.equal(
        micromark('[ref\\[]: /uri\n\n[foo][ref\\[]'),
        '<p><a href="/uri">foo</a></p>'
      )
    }
  )

  await t.test('should support escapes', async function () {
    assert.equal(
      micromark('[bar\\\\]: /uri\n\n[bar\\\\]'),
      '<p><a href="/uri">bar\\</a></p>'
    )
  })

  await t.test('should not support empty references', async function () {
    assert.equal(micromark('[]: /uri\n\n[]'), '<p>[]: /uri</p>\n<p>[]</p>')
  })

  await t.test('should not support blank references', async function () {
    assert.equal(
      micromark('[\n ]: /uri\n\n[\n ]'),
      '<p>[\n]: /uri</p>\n<p>[\n]</p>'
    )
  })

  await t.test('should support collaped references', async function () {
    assert.equal(
      micromark('[foo]: /url "title"\n\n[foo][]'),
      '<p><a href="/url" title="title">foo</a></p>'
    )
  })

  await t.test(
    'should support content in collaped references',
    async function () {
      assert.equal(
        micromark('[*foo* bar]: /url "title"\n\n[*foo* bar][]'),
        '<p><a href="/url" title="title"><em>foo</em> bar</a></p>'
      )
    }
  )

  await t.test(
    'should match references to definitions case-insensitively',
    async function () {
      assert.equal(
        micromark('[foo]: /url "title"\n\n[Foo][]'),
        '<p><a href="/url" title="title">Foo</a></p>'
      )
    }
  )

  await t.test(
    'should not support whitespace between label and collaped reference',
    async function () {
      assert.equal(
        micromark('[foo]: /url "title"\n\n[foo] \n[]'),
        '<p><a href="/url" title="title">foo</a>\n[]</p>'
      )
    }
  )

  await t.test('should support shortcut references', async function () {
    assert.equal(
      micromark('[foo]: /url "title"\n\n[foo]'),
      '<p><a href="/url" title="title">foo</a></p>'
    )
  })

  await t.test(
    'should support content in shortcut references (1)',
    async function () {
      assert.equal(
        micromark('[*foo* bar]: /url "title"\n\n[*foo* bar]'),
        '<p><a href="/url" title="title"><em>foo</em> bar</a></p>'
      )
    }
  )

  await t.test(
    'should support content in shortcut references (2)',
    async function () {
      assert.equal(
        micromark('[*foo* bar]: /url "title"\n\n[[*foo* bar]]'),
        '<p>[<a href="/url" title="title"><em>foo</em> bar</a>]</p>'
      )
    }
  )

  await t.test(
    'should support content in shortcut references (3)',
    async function () {
      assert.equal(
        micromark('[foo]: /url\n\n[[bar [foo]'),
        '<p>[[bar <a href="/url">foo</a></p>'
      )
    }
  )

  await t.test(
    'should match shortcut references to definitions case-insensitively',
    async function () {
      assert.equal(
        micromark('[foo]: /url "title"\n\n[Foo]'),
        '<p><a href="/url" title="title">Foo</a></p>'
      )
    }
  )

  await t.test(
    'should support whitespace after a shortcut reference',
    async function () {
      assert.equal(
        micromark('[foo]: /url\n\n[foo] bar'),
        '<p><a href="/url">foo</a> bar</p>'
      )
    }
  )

  await t.test(
    'should “support” an escaped shortcut reference',
    async function () {
      assert.equal(micromark('[foo]: /url "title"\n\n\\[foo]'), '<p>[foo]</p>')
    }
  )

  await t.test(
    'should prefer shortcut references over emphasis',
    async function () {
      assert.equal(
        micromark('[foo*]: /url\n\n*[foo*]'),
        '<p>*<a href="/url">foo*</a></p>'
      )
    }
  )

  await t.test(
    'should prefer full references over shortcut references',
    async function () {
      assert.equal(
        micromark('[foo]: /url1\n[bar]: /url2\n\n[foo][bar]'),
        '<p><a href="/url2">foo</a></p>'
      )
    }
  )

  await t.test(
    'should prefer collapsed references over shortcut references',
    async function () {
      assert.equal(
        micromark('[foo]: /url1\n\n[foo][]'),
        '<p><a href="/url1">foo</a></p>'
      )
    }
  )

  await t.test(
    'should prefer resources over shortcut references',
    async function () {
      assert.equal(
        micromark('[foo]: /url1\n\n[foo]()'),
        '<p><a href="">foo</a></p>'
      )
    }
  )

  await t.test(
    'should support shortcut references when followed by nonconforming resources',
    async function () {
      assert.equal(
        micromark('[foo]: /url1\n\n[foo](not a link)'),
        '<p><a href="/url1">foo</a>(not a link)</p>'
      )
    }
  )

  await t.test('stable/unstable (1)', async function () {
    assert.equal(
      micromark('[baz]: /url\n\n[foo][bar][baz]'),
      '<p>[foo]<a href="/url">bar</a></p>'
    )
  })

  await t.test('stable/unstable (2)', async function () {
    assert.equal(
      micromark('[baz]: /url1\n[bar]: /url2\n\n[foo][bar][baz]'),
      '<p><a href="/url2">foo</a><a href="/url1">baz</a></p>'
    )
  })

  await t.test('stable/unstable (3)', async function () {
    assert.equal(
      micromark('[baz]: /url1\n[foo]: /url2\n\n[foo][bar][baz]'),
      '<p>[foo]<a href="/url1">bar</a></p>'
    )
  })

  await t.test(
    'should not support whitespace-only full references',
    async function () {
      // Extra
      // This matches most implimentations, but is not strictly according to spec.
      // See: <https://github.com/commonmark/commonmark-spec/issues/653>
      assert.equal(
        micromark('[x]: /url\n\n[x][ ], [x][\t], [x][\n], [x][]'),
        '<p>[x][ ], [x][\t], [x][\n], <a href="/url">x</a></p>'
      )
    }
  )

  await t.test(
    'should not support mismatched character escapes in shortcuts',
    async function () {
      // See also: <https://github.com/commonmark/commonmark-spec/issues/616>
      assert.equal(
        micromark(
          '[+]: example.com\n[\\;]: example.com\n\nWill it link? [\\+], [;]'
        ),
        '<p>Will it link? [+], [;]</p>'
      )
    }
  )

  await t.test(
    'should not support mismatched character references in shortcuts',
    async function () {
      assert.equal(
        micromark(
          '[©]: example.com\n[&amp;]: example.com\n\nWill it link? [&copy;], [&]'
        ),
        '<p>Will it link? [©], [&amp;]</p>'
      )
    }
  )

  await t.test(
    'should not support mismatched character escapes in collapsed',
    async function () {
      assert.equal(
        micromark(
          '[+]: example.com\n[\\;]: example.com\n\nWill it link? [\\+][], [;][]'
        ),
        '<p>Will it link? [+][], [;][]</p>'
      )
    }
  )

  await t.test(
    'should not support mismatched character references in collapsed',
    async function () {
      assert.equal(
        micromark(
          '[©]: example.com\n[&amp;]: example.com\n\nWill it link? [&copy;][], [&][]'
        ),
        '<p>Will it link? [©][], [&amp;][]</p>'
      )
    }
  )

  await t.test(
    'should not support mismatched character escapes in fulls',
    async function () {
      assert.equal(
        micromark(
          '[+]: example.com\n[\\;]: example.com\n\nWill it link? [a][ \\+ ], [b][ ; ]'
        ),
        '<p>Will it link? [a][ + ], [b][ ; ]</p>'
      )
    }
  )

  await t.test(
    'should not support mismatched character references in fulls',
    async function () {
      assert.equal(
        micromark(
          '[©]: example.com\n[&amp;]: example.com\n\nWill it link? [a][ &copy; ], [b][ & ]'
        ),
        '<p>Will it link? [a][ © ], [b][ &amp; ]</p>'
      )
    }
  )

  await t.test(
    'should properly handle labels w/ character references and -escapes, and phrasing',
    async function () {
      assert.equal(
        micromark(
          `[*f*][]
[&semi;][]
[\\;][]
[;][]
[*f*&semi;][]
[*f*\\;][]
[*f*;][]

[*f*]: alpha
[&semi;]: bravo
[\\;]: charlie
[;]: delta
[*f*&semi;]: echo
[*f*\\;]: foxtrot
[*f*;]: golf`
        ),
        `<p><a href="alpha"><em>f</em></a>
<a href="bravo">;</a>
<a href="charlie">;</a>
<a href="delta">;</a>
<a href="echo"><em>f</em>;</a>
<a href="foxtrot"><em>f</em>;</a>
<a href="golf"><em>f</em>;</a></p>
`
      )
    }
  )

  // 999 `x` characters.
  const max = Array.from({length: 1000}).join('x')

  await t.test('should support 999 characters in reference', async function () {
    assert.equal(
      micromark('[' + max + ']: a\n[y][' + max + ']'),
      '<p><a href="a">y</a></p>'
    )
  })

  await t.test(
    'should not support 1000 characters in reference',
    async function () {
      assert.equal(
        micromark('[' + max + 'x]: a\n[y][' + max + 'x]'),
        '<p>[' + max + 'x]: a\n[y][' + max + 'x]</p>'
      )
    }
  )

  await t.test(
    'should not fail on a missing colon in a definition',
    async function () {
      assert.equal(
        micromark('[x] missing-colon\n\nWill it link? [x]'),
        '<p>[x] missing-colon</p>\n<p>Will it link? [x]</p>'
      )
    }
  )

  await t.test(
    'should support turning off label start (link)',
    async function () {
      assert.equal(
        micromark('[x]()', {
          extensions: [{disable: {null: ['labelStartLink']}}]
        }),
        '<p>[x]()</p>'
      )
    }
  )

  await t.test('should support turning off label end', async function () {
    assert.equal(
      micromark('[x]()', {extensions: [{disable: {null: ['labelEnd']}}]}),
      '<p>[x]()</p>'
    )
  })
})
