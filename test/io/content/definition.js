import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('definition', async function (t) {
  await t.test('should support link definitions', async function () {
    assert.equal(
      micromark('[foo]: /url "title"\n\n[foo]'),
      '<p><a href="/url" title="title">foo</a></p>'
    )
  })

  await t.test(
    'should not support blank lines before destination',
    async function () {
      assert.equal(
        micromark('[foo]:\n\n/url\n\n[foo]'),
        '<p>[foo]:</p>\n<p>/url</p>\n<p>[foo]</p>'
      )
    }
  )

  await t.test(
    'should support whitespace and line endings in definitions',
    async function () {
      assert.equal(
        micromark(
          "   [foo]: \n      /url  \n           'the title'  \n\n[foo]"
        ),
        '<p><a href="/url" title="the title">foo</a></p>'
      )
    }
  )

  await t.test('should support complex definitions (1)', async function () {
    assert.equal(
      micromark("[Foo*bar\\]]:my_(url) 'title (with parens)'\n\n[Foo*bar\\]]"),
      '<p><a href="my_(url)" title="title (with parens)">Foo*bar]</a></p>'
    )
  })

  await t.test('should support complex definitions (2)', async function () {
    assert.equal(
      micromark("[Foo bar]:\n<my url>\n'title'\n\n[Foo bar]"),
      '<p><a href="my%20url" title="title">Foo bar</a></p>'
    )
  })

  await t.test('should support line endings in titles', async function () {
    assert.equal(
      micromark("[foo]: /url '\ntitle\nline1\nline2\n'\n\n[foo]"),
      '<p><a href="/url" title="\ntitle\nline1\nline2\n">foo</a></p>'
    )
  })

  await t.test('should not support blank lines in titles', async function () {
    assert.equal(
      micromark("[foo]: /url 'title\n\nwith blank line'\n\n[foo]"),
      "<p>[foo]: /url 'title</p>\n<p>with blank line'</p>\n<p>[foo]</p>"
    )
  })

  await t.test('should support definitions w/o title', async function () {
    assert.equal(
      micromark('[foo]:\n/url\n\n[foo]'),
      '<p><a href="/url">foo</a></p>'
    )
  })

  await t.test(
    'should not support definitions w/o destination',
    async function () {
      assert.equal(micromark('[foo]:\n\n[foo]'), '<p>[foo]:</p>\n<p>[foo]</p>')
    }
  )

  await t.test(
    'should support definitions w/ explicit empty destinations',
    async function () {
      assert.equal(micromark('[foo]: <>\n\n[foo]'), '<p><a href="">foo</a></p>')
    }
  )

  await t.test(
    'should not support definitions w/ no whitespace between destination and title',
    async function () {
      assert.equal(
        micromark('[foo]: <bar>(baz)\n\n[foo]', {allowDangerousHtml: true}),
        '<p>[foo]: <bar>(baz)</p>\n<p>[foo]</p>'
      )
    }
  )

  await t.test(
    'should support character escapes in destinations and titles',
    async function () {
      assert.equal(
        micromark('[foo]: /url\\bar\\*baz "foo\\"bar\\baz"\n\n[foo]'),
        '<p><a href="/url%5Cbar*baz" title="foo&quot;bar\\baz">foo</a></p>'
      )
    }
  )

  await t.test('should support a link before a definition', async function () {
    assert.equal(
      micromark('[foo]\n\n[foo]: url'),
      '<p><a href="url">foo</a></p>\n'
    )
  })

  await t.test('should match w/ the first definition', async function () {
    assert.equal(
      micromark('[foo]: first\n[foo]: second\n\n[foo]'),
      '<p><a href="first">foo</a></p>'
    )
  })

  await t.test('should match w/ case-insensitive (1)', async function () {
    assert.equal(
      micromark('[FOO]: /url\n\n[Foo]'),
      '<p><a href="/url">Foo</a></p>'
    )
  })

  await t.test('should match w/ case-insensitive (2)', async function () {
    assert.equal(
      micromark('[ΑΓΩ]: /φου\n\n[αγω]'),
      '<p><a href="/%CF%86%CE%BF%CF%85">αγω</a></p>'
    )
  })

  await t.test(
    'should not contribute anything w/o reference (1)',
    async function () {
      assert.equal(micromark('[foo]: /url'), '')
    }
  )

  await t.test(
    'should not contribute anything w/o reference (2)',
    async function () {
      assert.equal(micromark('[\nfoo\n]: /url\nbar'), '<p>bar</p>')
    }
  )

  await t.test('should support whitespace after title', async function () {
    assert.equal(
      micromark('[foo]: /url "title"  \n\n[foo]'),
      '<p><a href="/url" title="title">foo</a></p>'
    )
  })

  await t.test(
    'should support whitespace after title on a separate line',
    async function () {
      assert.equal(
        micromark('[foo]: /url\n"title"  \n\n[foo]'),
        '<p><a href="/url" title="title">foo</a></p>'
      )
    }
  )

  await t.test(
    'should not support non-whitespace content after definitions (1)',
    async function () {
      assert.equal(
        micromark('[foo]: /url "title" ok'),
        '<p>[foo]: /url &quot;title&quot; ok</p>'
      )
    }
  )

  await t.test(
    'should not support non-whitespace content after definitions (2)',
    async function () {
      assert.equal(
        micromark('[foo]: /url\n"title" ok'),
        '<p>&quot;title&quot; ok</p>'
      )
    }
  )

  await t.test(
    'should prefer indented code over definitions',
    async function () {
      assert.equal(
        micromark('    [foo]: /url "title"\n\n[foo]'),
        '<pre><code>[foo]: /url &quot;title&quot;\n</code></pre>\n<p>[foo]</p>'
      )
    }
  )

  await t.test(
    'should not support definitions in fenced code',
    async function () {
      assert.equal(
        micromark('```\n[foo]: /url\n```\n\n[foo]'),
        '<pre><code>[foo]: /url\n</code></pre>\n<p>[foo]</p>'
      )
    }
  )

  await t.test(
    'should not support definitions in paragraphs',
    async function () {
      assert.equal(
        micromark('Foo\n[bar]: /baz\n\n[bar]'),
        '<p>Foo\n[bar]: /baz</p>\n<p>[bar]</p>'
      )
    }
  )

  await t.test('should not support definitions in headings', async function () {
    assert.equal(
      micromark('# [Foo]\n[foo]: /url\n> bar'),
      '<h1><a href="/url">Foo</a></h1>\n<blockquote>\n<p>bar</p>\n</blockquote>'
    )
  })

  await t.test(
    'should support setext headings after definitions',
    async function () {
      assert.equal(
        micromark('[foo]: /url\nbar\n===\n[foo]'),
        '<h1>bar</h1>\n<p><a href="/url">foo</a></p>'
      )
    }
  )

  await t.test(
    'should not support setext heading underlines after definitions',
    async function () {
      assert.equal(
        micromark('[foo]: /url\n===\n[foo]'),
        '<p>===\n<a href="/url">foo</a></p>'
      )
    }
  )

  await t.test(
    'should support definitions after definitions',
    async function () {
      assert.equal(
        micromark(
          '[foo]: /foo-url "foo"\n[bar]: /bar-url\n  "bar"\n[baz]: /baz-url\n\n[foo],\n[bar],\n[baz]'
        ),
        '<p><a href="/foo-url" title="foo">foo</a>,\n<a href="/bar-url" title="bar">bar</a>,\n<a href="/baz-url">baz</a></p>'
      )
    }
  )

  await t.test('should support definitions in block quotes', async function () {
    assert.equal(
      micromark('> [foo]: /url\n\n[foo]'),
      '<blockquote>\n</blockquote>\n<p><a href="/url">foo</a></p>'
    )
  })

  await t.test('should match w/ character escapes', async function () {
    // Extra
    assert.equal(
      micromark('[\\[\\+\\]]: example.com\n\nLink: [\\[\\+\\]].'),
      '<p>Link: <a href="example.com">[+]</a>.</p>'
    )
  })

  await t.test(
    'should support character escapes & references in unenclosed destinations',
    async function () {
      assert.equal(
        micromark('[x]: \\"&#x20;\\(\\)\\"\n\n[x]'),
        '<p><a href="%22%20()%22">x</a></p>'
      )
    }
  )

  await t.test(
    'should support character escapes & references in enclosed destinations',
    async function () {
      assert.equal(
        micromark('[x]: <\\>&#x20;\\+\\>>\n\n[x]'),
        '<p><a href="%3E%20+%3E">x</a></p>'
      )
    }
  )

  await t.test(
    'should not support a line ending at start of enclosed destination',
    async function () {
      assert.equal(micromark('[x]: <\n\n[x]'), '<p>[x]: &lt;</p>\n<p>[x]</p>')
    }
  )

  await t.test(
    'should not support a line ending in enclosed destination',
    async function () {
      assert.equal(micromark('[x]: <x\n\n[x]'), '<p>[x]: &lt;x</p>\n<p>[x]</p>')
    }
  )

  await t.test(
    'should not support ascii control characters at the start of destination',
    async function () {
      assert.equal(micromark('[x]: \va\n\n[x]'), '<p>[x]: \va</p>\n<p>[x]</p>')
    }
  )

  await t.test(
    'should not support ascii control characters in destination',
    async function () {
      assert.equal(
        micromark('[x]: a\vb\n\n[x]'),
        '<p>[x]: a\vb</p>\n<p>[x]</p>'
      )
    }
  )

  await t.test(
    'should support ascii control characters at the start of enclosed destination',
    async function () {
      assert.equal(
        micromark('[x]: <\va>\n\n[x]'),
        '<p><a href="%0Ba">x</a></p>'
      )
    }
  )

  await t.test(
    'should support ascii control characters in enclosed destinations',
    async function () {
      assert.equal(
        micromark('[x]: <a\vb>\n\n[x]'),
        '<p><a href="a%0Bb">x</a></p>'
      )
    }
  )

  await t.test(
    'should support character escapes at the start of a title',
    async function () {
      assert.equal(
        micromark('[x]: a "\\""\n\n[x]'),
        '<p><a href="a" title="&quot;">x</a></p>'
      )
    }
  )

  await t.test('should support double quoted titles', async function () {
    assert.equal(
      micromark('[x]: a "\\\'"\n\n[x]'),
      '<p><a href="a" title="\'">x</a></p>'
    )
  })

  await t.test('should support single quoted titles', async function () {
    assert.equal(
      micromark("[x]: a '\"'\n\n[x]"),
      '<p><a href="a" title="&quot;">x</a></p>'
    )
  })

  await t.test('should support paren enclosed titles', async function () {
    assert.equal(
      micromark('[x]: a ("\')\n\n[x]'),
      '<p><a href="a" title="&quot;\'">x</a></p>'
    )
  })

  await t.test(
    'should not support more opening than closing parens in the destination',
    async function () {
      assert.equal(
        micromark('[x]: a(()\n\n[x]'),
        '<p>[x]: a(()</p>\n<p>[x]</p>'
      )
    }
  )

  await t.test(
    'should support balanced opening and closing parens in the destination',
    async function () {
      assert.equal(
        micromark('[x]: a(())\n\n[x]'),
        '<p><a href="a(())">x</a></p>'
      )
    }
  )

  await t.test(
    'should not support more closing than opening parens in the destination',
    async function () {
      assert.equal(
        micromark('[x]: a())\n\n[x]'),
        '<p>[x]: a())</p>\n<p>[x]</p>'
      )
    }
  )

  await t.test(
    'should support trailing whitespace after a destination',
    async function () {
      assert.equal(micromark('[x]: a  \t\n\n[x]'), '<p><a href="a">x</a></p>')
    }
  )

  await t.test(
    'should support trailing whitespace after a title',
    async function () {
      assert.equal(
        micromark('[x]: a "x" \t\n\n[x]'),
        '<p><a href="a" title="x">x</a></p>'
      )
    }
  )

  await t.test(
    'should support character references in definitions',
    async function () {
      assert.equal(
        micromark(
          '[&amp;&copy;&]: example.com/&amp;&copy;& "&amp;&copy;&"\n\n[&amp;&copy;&]'
        ),
        '<p><a href="example.com/&amp;%C2%A9&amp;" title="&amp;©&amp;">&amp;©&amp;</a></p>'
      )
    }
  )

  await t.test(
    'should support a line ending before a destination',
    async function () {
      assert.equal(
        micromark('[x]:\nexample.com\n\n[x]'),
        '<p><a href="example.com">x</a></p>'
      )
    }
  )

  await t.test(
    'should support whitespace before a destination',
    async function () {
      assert.equal(
        micromark('[x]: \t\nexample.com\n\n[x]'),
        '<p><a href="example.com">x</a></p>'
      )
    }
  )

  await t.test('should ignore an empty title', async function () {
    // See: <https://github.com/commonmark/commonmark.js/issues/192>
    assert.equal(micromark('[x]: <> ""\n[][x]'), '<p><a href=""></a></p>')
  })

  await t.test(
    'should not support a less than in an enclosed destination',
    async function () {
      assert.equal(
        micromark('[a]\n\n[a]: <b<c>', {allowDangerousHtml: true}),
        '<p>[a]</p>\n<p>[a]: &lt;b<c></p>'
      )
    }
  )

  await t.test(
    'should not support an extra left paren (`(`) in a raw destination',
    async function () {
      assert.equal(micromark('[a]\n\n[a]: b(c'), '<p>[a]</p>\n<p>[a]: b(c</p>')
    }
  )

  await t.test(
    'should not support an extra right paren (`)`) in a raw destination',
    async function () {
      assert.equal(micromark('[a]\n\n[a]: b)c'), '<p>[a]</p>\n<p>[a]: b)c</p>')
    }
  )

  await t.test(
    'should not support an extra right paren (`)`) in a raw destination',
    async function () {
      assert.equal(micromark('[a]\n\n[a]: b)c'), '<p>[a]</p>\n<p>[a]: b)c</p>')
    }
  )

  await t.test(
    'should support 4 or more sets of parens in a raw destination (link resources don’t)',
    async function () {
      assert.equal(
        micromark('[a]\n\n[a]: a(1(2(3(4()))))b'),
        '<p><a href="a(1(2(3(4()))))b">a</a></p>\n'
      )
    }
  )

  await t.test(
    'should not support a final (unbalanced) right paren in a raw destination',
    async function () {
      assert.equal(
        micromark('[a]\n\n[a]: aaa)'),
        '<p>[a]</p>\n<p>[a]: aaa)</p>'
      )
    }
  )

  await t.test(
    'should not support a final (unbalanced) right paren in a raw destination “before” a title',
    async function () {
      assert.equal(
        micromark('[a]\n\n[a]: aaa) "a"'),
        '<p>[a]</p>\n<p>[a]: aaa) &quot;a&quot;</p>'
      )
    }
  )

  await t.test(
    'should support subsequent indented definitions',
    async function () {
      assert.equal(
        micromark(
          ' [a]: b "c"\n  [d]: e\n   [f]: g "h"\n    [i]: j\n\t[k]: l (m)\n\t n [k] o'
        ),
        '<p>n <a href="l" title="m">k</a> o</p>'
      )
    }
  )

  await t.test(
    'should support line prefixes in definition labels',
    async function () {
      assert.equal(
        micromark('[a\n  b]: c\n\n[a\n  b]'),
        '<p><a href="c">a\nb</a></p>'
      )
    }
  )

  await t.test(
    'should not support definitions w/ only a closing paren as a raw destination',
    async function () {
      assert.equal(micromark('[a]: )\n\n[a]'), '<p>[a]: )</p>\n<p>[a]</p>')
    }
  )

  await t.test(
    'should not support definitions w/ closing paren + more text as a raw destination',
    async function () {
      assert.equal(micromark('[a]: )b\n\n[a]'), '<p>[a]: )b</p>\n<p>[a]</p>')
    }
  )

  await t.test(
    'should not support definitions w/ text + a closing paren as a raw destination',
    async function () {
      assert.equal(micromark('[a]: b)\n\n[a]'), '<p>[a]: b)</p>\n<p>[a]</p>')
    }
  )

  await t.test('should support turning off definitions', async function () {
    assert.equal(
      micromark('[foo]: /url "title"', {
        extensions: [{disable: {null: ['definition']}}]
      }),
      '<p>[foo]: /url &quot;title&quot;</p>'
    )
  })
})
