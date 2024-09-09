import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

const unsafe = {allowDangerousHtml: true}

test('html', async function (t) {
  await t.test('1 (raw)', async function (t) {
    await t.test('should support raw pre tags (type 1)', async function () {
      assert.equal(
        micromark(
          [
            '<pre language="haskell"><code>',
            'import Text.HTML.TagSoup',
            '',
            'main :: IO ()',
            'main = print $ parseTags tags',
            '</code></pre>',
            'okay'
          ].join('\n'),
          unsafe
        ),
        [
          '<pre language="haskell"><code>',
          'import Text.HTML.TagSoup',
          '',
          'main :: IO ()',
          'main = print $ parseTags tags',
          '</code></pre>',
          '<p>okay</p>'
        ].join('\n')
      )
    })

    await t.test('should support raw script tags', async function () {
      assert.equal(
        micromark(
          [
            '<script type="text/javascript">',
            '// JavaScript example',
            '',
            'document.getElementById("demo").innerHTML = "Hello JavaScript!";',
            '</script>',
            'okay'
          ].join('\n'),
          unsafe
        ),
        [
          '<script type="text/javascript">',
          '// JavaScript example',
          '',
          'document.getElementById("demo").innerHTML = "Hello JavaScript!";',
          '</script>',
          '<p>okay</p>'
        ].join('\n')
      )
    })

    await t.test('should support raw style tags', async function () {
      assert.equal(
        micromark(
          [
            '<style',
            '  type="text/css">',
            'h1 {color:red;}',
            '',
            'p {color:blue;}',
            '</style>',
            'okay'
          ].join('\n'),
          unsafe
        ),
        [
          '<style',
          '  type="text/css">',
          'h1 {color:red;}',
          '',
          'p {color:blue;}',
          '</style>',
          '<p>okay</p>'
        ].join('\n')
      )
    })

    await t.test('should support raw tags w/o ending', async function () {
      assert.equal(
        micromark('<style\n  type="text/css">\n\nfoo', unsafe),
        '<style\n  type="text/css">\n\nfoo'
      )
    })

    await t.test(
      'should support raw tags w/ start and end on a single line',
      async function () {
        assert.equal(
          micromark('<style>p{color:red;}</style>\n*foo*', unsafe),
          '<style>p{color:red;}</style>\n<p><em>foo</em></p>'
        )
      }
    )

    await t.test(
      'should support raw tags w/ more data on ending line',
      async function () {
        assert.equal(
          micromark('<script>\nfoo\n</script>1. *bar*', unsafe),
          '<script>\nfoo\n</script>1. *bar*'
        )
      }
    )

    await t.test(
      'should support an eof directly after a raw tag name',
      async function () {
        assert.equal(micromark('<script', unsafe), '<script')
      }
    )

    await t.test('should not support a raw closing tag', async function () {
      assert.equal(
        micromark('</script\nmore', unsafe),
        '<p>&lt;/script\nmore</p>'
      )
    })

    await t.test(
      'should not support an eof after a self-closing slash',
      async function () {
        assert.equal(micromark('<script/', unsafe), '<p>&lt;script/</p>')
      }
    )

    await t.test(
      'should not support a line ending after a self-closing slash',
      async function () {
        assert.equal(
          micromark('<script/\n*asd*', unsafe),
          '<p>&lt;script/\n<em>asd</em></p>'
        )
      }
    )

    await t.test(
      'should support an eof after a self-closing tag',
      async function () {
        assert.equal(micromark('<script/>', unsafe), '<script/>')
      }
    )

    await t.test(
      'should support a line ending after a self-closing tag',
      async function () {
        assert.equal(micromark('<script/>\na', unsafe), '<script/>\na')
      }
    )

    await t.test(
      'should not support other characters after a self-closing tag',
      async function () {
        assert.equal(micromark('<script/>a', unsafe), '<p><script/>a</p>')
      }
    )

    await t.test('should support a textarea', async function () {
      assert.equal(
        micromark('<textarea>\n# hi!\n</textarea>\n# ?', unsafe),
        '<textarea>\n# hi!\n</textarea>\n<h1>?</h1>'
      )
    })

    await t.test(
      'should ignore long closing tags (coverage for max size)',
      async function () {
        assert.equal(
          micromark('<textarea>\n# hi!\n</xxxxxxxxx>\n# ?', unsafe),
          '<textarea>\n# hi!\n</xxxxxxxxx>\n# ?'
        )
      }
    )

    await t.test(
      'should support other characters after a raw opening tag',
      async function () {
        assert.equal(micromark('<script>a', unsafe), '<script>a')
      }
    )

    await t.test(
      'should support interrupting paragraphs w/ raw tags',
      async function () {
        // Extra.
        assert.equal(micromark('Foo\n<script', unsafe), '<p>Foo</p>\n<script')
      }
    )

    await t.test('should support blank lines in raw', async function () {
      assert.equal(
        micromark('<script>\n  \n  \n</script>', unsafe),
        '<script>\n  \n  \n</script>'
      )
    })

    await t.test('should not support lazyness (1)', async function () {
      assert.equal(
        micromark('> <script>\na', unsafe),
        '<blockquote>\n<script>\n</blockquote>\n<p>a</p>'
      )
    })

    await t.test('should not support lazyness (2)', async function () {
      assert.equal(
        micromark('> a\n<script>', unsafe),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<script>'
      )
    })
  })

  await t.test('2 (comment)', async function (t) {
    await t.test('should support comments (type 2)', async function () {
      assert.equal(
        micromark('<!-- Foo\n\nbar\n   baz -->\nokay', unsafe),
        '<!-- Foo\n\nbar\n   baz -->\n<p>okay</p>'
      )
    })

    await t.test(
      'should support comments w/ start and end on a single line',
      async function () {
        assert.equal(
          micromark('<!-- foo -->*bar*\n*baz*', unsafe),
          '<!-- foo -->*bar*\n<p><em>baz</em></p>'
        )
      }
    )

    await t.test(
      'should not support a single dash to start comments',
      async function () {
        assert.equal(micromark('<!-asd-->', unsafe), '<p>&lt;!-asd--&gt;</p>')
      }
    )

    await t.test(
      'should support comments where the start dashes are the end dashes (1)',
      async function () {
        assert.equal(micromark('<!-->', unsafe), '<!-->')
      }
    )

    await t.test(
      'should support comments where the start dashes are the end dashes (2)',
      async function () {
        assert.equal(micromark('<!--->', unsafe), '<!--->')
      }
    )

    await t.test('should support empty comments', async function () {
      assert.equal(micromark('<!---->', unsafe), '<!---->')
    })

    await t.test(
      'should not end a comment at one dash (`->`)',
      async function () {
        // If the `"` is encoded, we’re in text. If it remains, we’re in HTML.
        assert.equal(micromark('<!--\n->\n"', unsafe), '<!--\n->\n"')
      }
    )

    await t.test(
      'should end a comment at two dashes (`-->`)',
      async function () {
        assert.equal(
          micromark('<!--\n-->\n"', unsafe),
          '<!--\n-->\n<p>&quot;</p>'
        )
      }
    )

    await t.test(
      'should end a comment at three dashes (`--->`)',
      async function () {
        assert.equal(
          micromark('<!--\n--->\n"', unsafe),
          '<!--\n--->\n<p>&quot;</p>'
        )
      }
    )

    await t.test(
      'should end a comment at four dashes (`---->`)',
      async function () {
        assert.equal(
          micromark('<!--\n---->\n"', unsafe),
          '<!--\n---->\n<p>&quot;</p>'
        )
      }
    )

    await t.test('should support comments w/ indent', async function () {
      assert.equal(micromark('  <!-- foo -->', unsafe), '  <!-- foo -->')
    })

    await t.test(
      'should not support comments w/ a 4 character indent',
      async function () {
        assert.equal(
          micromark('    <!-- foo -->', unsafe),
          '<pre><code>&lt;!-- foo --&gt;\n</code></pre>'
        )
      }
    )

    await t.test(
      'should support interrupting paragraphs w/ comments',
      async function () {
        // Extra.
        assert.equal(micromark('Foo\n<!--', unsafe), '<p>Foo</p>\n<!--')
      }
    )

    await t.test('should support blank lines in comments', async function () {
      assert.equal(micromark('<!--\n  \n  \n-->', unsafe), '<!--\n  \n  \n-->')
    })

    await t.test('should not support lazyness (1)', async function () {
      assert.equal(
        micromark('> <!--\na', unsafe),
        '<blockquote>\n<!--\n</blockquote>\n<p>a</p>'
      )
    })

    await t.test('should not support lazyness (2)', async function () {
      assert.equal(
        micromark('> a\n<!--', unsafe),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<!--'
      )
    })
  })

  await t.test('3 (instruction)', async function (t) {
    await t.test('should support instructions (type 3)', async function () {
      assert.equal(
        micromark("<?php\n\n  echo '>';\n\n?>\nokay", unsafe),
        "<?php\n\n  echo '>';\n\n?>\n<p>okay</p>"
      )
    })

    await t.test(
      'should support empty instructions where the `?` is part of both the start and the end',
      async function () {
        assert.equal(micromark('<?>', unsafe), '<?>')
      }
    )

    await t.test('should support empty instructions', async function () {
      assert.equal(micromark('<??>', unsafe), '<??>')
    })

    await t.test(
      'should support interrupting paragraphs w/ instructions',
      async function () {
        // Extra.
        assert.equal(micromark('Foo\n<?', unsafe), '<p>Foo</p>\n<?')
      }
    )

    await t.test(
      'should support blank lines in instructions',
      async function () {
        assert.equal(micromark('<?\n  \n  \n?>', unsafe), '<?\n  \n  \n?>')
      }
    )

    await t.test('should not support lazyness (1)', async function () {
      assert.equal(
        micromark('> <?\na', unsafe),
        '<blockquote>\n<?\n</blockquote>\n<p>a</p>'
      )
    })

    await t.test('should not support lazyness (2)', async function () {
      assert.equal(
        micromark('> a\n<?', unsafe),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<?'
      )
    })
  })

  await t.test('4 (declaration)', async function (t) {
    await t.test('should support declarations (type 4)', async function () {
      assert.equal(micromark('<!DOCTYPE html>', unsafe), '<!DOCTYPE html>')
    })

    await t.test(
      'should not support declarations that start w/o an alpha',
      async function () {
        assert.equal(micromark('<!123>', unsafe), '<p>&lt;!123&gt;</p>')
      }
    )

    await t.test(
      'should not support declarations w/o an identifier',
      async function () {
        assert.equal(micromark('<!>', unsafe), '<p>&lt;!&gt;</p>')
      }
    )

    await t.test(
      'should support declarations w/o a single alpha as identifier',
      async function () {
        assert.equal(micromark('<!a>', unsafe), '<!a>')
      }
    )

    await t.test(
      'should support interrupting paragraphs w/ declarations',
      async function () {
        // Extra.
        assert.equal(micromark('Foo\n<!d', unsafe), '<p>Foo</p>\n<!d')
      }
    )

    await t.test(
      'should support blank lines in declarations',
      async function () {
        // Note about the lower letter:
        // <https://github.com/commonmark/commonmark-spec/pull/621>
        assert.equal(micromark('<!a\n  \n  \n>', unsafe), '<!a\n  \n  \n>')
      }
    )

    await t.test('should not support lazyness (1)', async function () {
      assert.equal(
        micromark('> <!a\nb', unsafe),
        '<blockquote>\n<!a\n</blockquote>\n<p>b</p>'
      )
    })

    await t.test('should not support lazyness (2)', async function () {
      assert.equal(
        micromark('> a\n<!b', unsafe),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<!b'
      )
    })
  })

  await t.test('5 (cdata)', async function (t) {
    await t.test('should support cdata (type 5)', async function () {
      assert.equal(
        micromark(
          '<![CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]>\nokay',
          unsafe
        ),
        '<![CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]>\n<p>okay</p>'
      )
    })

    await t.test('should support empty cdata', async function () {
      assert.equal(micromark('<![CDATA[]]>', unsafe), '<![CDATA[]]>')
    })

    await t.test(
      'should not support cdata w/ a missing `[`',
      async function () {
        assert.equal(
          micromark('<![CDATA]]>', unsafe),
          '<p>&lt;![CDATA]]&gt;</p>'
        )
      }
    )

    await t.test(
      'should support cdata w/ a single `]` as content',
      async function () {
        assert.equal(micromark('<![CDATA[]]]>', unsafe), '<![CDATA[]]]>')
      }
    )

    await t.test(
      'should support interrupting paragraphs w/ cdata',
      async function () {
        // Extra.
        assert.equal(
          micromark('Foo\n<![CDATA[', unsafe),
          '<p>Foo</p>\n<![CDATA['
        )
      }
    )

    await t.test('should not support lowercase cdata', async function () {
      // Note: cmjs parses this differently.
      // See: <https://github.com/commonmark/commonmark.js/issues/193>
      assert.equal(
        micromark('<![cdata[]]>', unsafe),
        '<p>&lt;![cdata[]]&gt;</p>'
      )
    })

    await t.test('should support blank lines in cdata', async function () {
      assert.equal(
        micromark('<![CDATA[\n  \n  \n]]>', unsafe),
        '<![CDATA[\n  \n  \n]]>'
      )
    })

    await t.test('should not support lazyness (1)', async function () {
      assert.equal(
        micromark('> <![CDATA[\na', unsafe),
        '<blockquote>\n<![CDATA[\n</blockquote>\n<p>a</p>'
      )
    })

    await t.test('should not support lazyness (2)', async function () {
      assert.equal(
        micromark('> a\n<![CDATA[', unsafe),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<![CDATA['
      )
    })
  })

  await t.test('6 (basic)', async function (t) {
    await t.test('should support html (basic)', async function () {
      assert.equal(
        micromark(
          '<table><tr><td>\n<pre>\n**Hello**,\n\n_world_.\n</pre>\n</td></tr></table>',
          unsafe
        ),
        '<table><tr><td>\n<pre>\n**Hello**,\n<p><em>world</em>.\n</pre></p>\n</td></tr></table>'
      )
    })

    await t.test('should support html of type 6 (1)', async function () {
      assert.equal(
        micromark(
          [
            '<table>',
            '  <tr>',
            '    <td>',
            '           hi',
            '    </td>',
            '  </tr>',
            '</table>',
            '',
            'okay.'
          ].join('\n'),
          unsafe
        ),
        [
          '<table>',
          '  <tr>',
          '    <td>',
          '           hi',
          '    </td>',
          '  </tr>',
          '</table>',
          '<p>okay.</p>'
        ].join('\n')
      )
    })

    await t.test('should support html of type 6 (2)', async function () {
      assert.equal(
        micromark(' <div>\n  *hello*\n         <foo><a>', unsafe),
        ' <div>\n  *hello*\n         <foo><a>'
      )
    })

    await t.test(
      'should support html starting w/ a closing tag',
      async function () {
        assert.equal(micromark('</div>\n*foo*', unsafe), '</div>\n*foo*')
      }
    )

    await t.test(
      'should support html w/ markdown in between',
      async function () {
        assert.equal(
          micromark('<DIV CLASS="foo">\n\n*Markdown*\n\n</DIV>', unsafe),
          '<DIV CLASS="foo">\n<p><em>Markdown</em></p>\n</DIV>'
        )
      }
    )

    await t.test('should support html w/ line endings (1)', async function () {
      assert.equal(
        micromark('<div id="foo"\n  class="bar">\n</div>', unsafe),
        '<div id="foo"\n  class="bar">\n</div>'
      )
    })

    await t.test('should support html w/ line endings (2)', async function () {
      assert.equal(
        micromark('<div id="foo" class="bar\n  baz">\n</div>', unsafe),
        '<div id="foo" class="bar\n  baz">\n</div>'
      )
    })

    await t.test('should support an unclosed html element', async function () {
      assert.equal(
        micromark('<div>\n*foo*\n\n*bar*', unsafe),
        '<div>\n*foo*\n<p><em>bar</em></p>'
      )
    })

    await t.test('should support garbage html (1)', async function () {
      assert.equal(
        micromark('<div id="foo"\n*hi*', unsafe),
        '<div id="foo"\n*hi*'
      )
    })

    await t.test('should support garbage html (2)', async function () {
      assert.equal(micromark('<div class\nfoo', unsafe), '<div class\nfoo')
    })

    await t.test('should support garbage html (3)', async function () {
      assert.equal(
        micromark('<div *???-&&&-<---\n*foo*', unsafe),
        '<div *???-&&&-<---\n*foo*'
      )
    })

    await t.test(
      'should support other tags in the opening (1)',
      async function () {
        assert.equal(
          micromark('<div><a href="bar">*foo*</a></div>', unsafe),
          '<div><a href="bar">*foo*</a></div>'
        )
      }
    )

    await t.test(
      'should support other tags in the opening (2)',
      async function () {
        assert.equal(
          micromark('<table><tr><td>\nfoo\n</td></tr></table>', unsafe),
          '<table><tr><td>\nfoo\n</td></tr></table>'
        )
      }
    )

    await t.test(
      'should include everything ’till a blank line',
      async function () {
        assert.equal(
          micromark('<div></div>\n``` c\nint x = 33;\n```', unsafe),
          '<div></div>\n``` c\nint x = 33;\n```'
        )
      }
    )

    await t.test(
      'should support basic tags w/o ending in containers (1)',
      async function () {
        assert.equal(
          micromark('> <div>\n> foo\n\nbar', unsafe),
          '<blockquote>\n<div>\nfoo\n</blockquote>\n<p>bar</p>'
        )
      }
    )

    await t.test(
      'should support basic tags w/o ending in containers (2)',
      async function () {
        assert.equal(
          micromark('- <div>\n- foo', unsafe),
          '<ul>\n<li>\n<div>\n</li>\n<li>foo</li>\n</ul>'
        )
      }
    )

    await t.test('should support basic tags w/ indent', async function () {
      assert.equal(micromark('  <div>', unsafe), '  <div>')
    })

    await t.test(
      'should not support basic tags w/ a 4 character indent',
      async function () {
        assert.equal(
          micromark('    <div>', unsafe),
          '<pre><code>&lt;div&gt;\n</code></pre>'
        )
      }
    )

    await t.test(
      'should support interrupting paragraphs w/ basic tags',
      async function () {
        assert.equal(
          micromark('Foo\n<div>\nbar\n</div>', unsafe),
          '<p>Foo</p>\n<div>\nbar\n</div>'
        )
      }
    )

    await t.test('should require a blank line to end', async function () {
      assert.equal(
        micromark('<div>\nbar\n</div>\n*foo*', unsafe),
        '<div>\nbar\n</div>\n*foo*'
      )
    })

    await t.test(
      'should support interleaving w/ blank lines',
      async function () {
        assert.equal(
          micromark('<div>\n\n*Emphasized* text.\n\n</div>', unsafe),
          '<div>\n<p><em>Emphasized</em> text.</p>\n</div>'
        )
      }
    )

    await t.test(
      'should not support interleaving w/o blank lines',
      async function () {
        assert.equal(
          micromark('<div>\n*Emphasized* text.\n</div>', unsafe),
          '<div>\n*Emphasized* text.\n</div>'
        )
      }
    )

    await t.test(
      'should support blank lines between adjacent html',
      async function () {
        assert.equal(
          micromark(
            '<table>\n\n<tr>\n\n<td>\nHi\n</td>\n\n</tr>\n\n</table>',
            unsafe
          ),
          '<table>\n<tr>\n<td>\nHi\n</td>\n</tr>\n</table>'
        )
      }
    )

    await t.test(
      'should not support indented, blank-line delimited, adjacent html',
      async function () {
        assert.equal(
          micromark(
            [
              '<table>',
              '',
              '  <tr>',
              '',
              '    <td>',
              '      Hi',
              '    </td>',
              '',
              '  </tr>',
              '',
              '</table>'
            ].join('\n'),
            unsafe
          ),
          [
            '<table>',
            '  <tr>',
            '<pre><code>&lt;td&gt;',
            '  Hi',
            '&lt;/td&gt;',
            '</code></pre>',
            '  </tr>',
            '</table>'
          ].join('\n')
        )
      }
    )

    await t.test(
      'should not support basic tags w/ an incorrect name start character',
      async function () {
        assert.equal(micromark('</1>', unsafe), '<p>&lt;/1&gt;</p>')
      }
    )

    await t.test(
      'should support an eof directly after a basic tag name',
      async function () {
        assert.equal(micromark('<div', unsafe), '<div')
      }
    )

    await t.test(
      'should support a line ending directly after a tag name',
      async function () {
        assert.equal(micromark('<div\n', unsafe), '<div\n')
      }
    )

    await t.test(
      'should support an eof after a space directly after a tag name',
      async function () {
        assert.equal(micromark('<div ', unsafe), '<div ')
      }
    )

    await t.test(
      'should not support an eof directly after a self-closing slash',
      async function () {
        assert.equal(micromark('<div/', unsafe), '<p>&lt;div/</p>')
      }
    )

    await t.test(
      'should not support a line ending after a self-closing slash',
      async function () {
        assert.equal(
          micromark('<div/\n*asd*', unsafe),
          '<p>&lt;div/\n<em>asd</em></p>'
        )
      }
    )

    await t.test(
      'should support an eof after a self-closing tag',
      async function () {
        assert.equal(micromark('<div/>', unsafe), '<div/>')
      }
    )

    await t.test(
      'should support a line ending after a self-closing tag',
      async function () {
        assert.equal(micromark('<div/>\na', unsafe), '<div/>\na')
      }
    )

    await t.test(
      'should support another character after a self-closing tag',
      async function () {
        assert.equal(micromark('<div/>a', unsafe), '<div/>a')
      }
    )

    await t.test(
      'should support another character after a basic opening tag',
      async function () {
        assert.equal(micromark('<div>a', unsafe), '<div>a')
      }
    )

    await t.test(
      'should support interrupting paragraphs w/ self-closing basic tags',
      async function () {
        // Extra.
        assert.equal(micromark('Foo\n<div/>', unsafe), '<p>Foo</p>\n<div/>')
      }
    )

    await t.test('should not support blank lines in basic', async function () {
      assert.equal(
        micromark('<div\n  \n  \n>', unsafe),
        '<div\n<blockquote>\n</blockquote>'
      )
    })

    await t.test('should not support lazyness (1)', async function () {
      assert.equal(
        micromark('> <div\na', unsafe),
        '<blockquote>\n<div\n</blockquote>\n<p>a</p>'
      )
    })

    await t.test('should not support lazyness (2)', async function () {
      assert.equal(
        micromark('> a\n<div', unsafe),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<div'
      )
    })
  })

  await t.test('7 (complete)', async function (t) {
    await t.test('should support complete tags (type 7)', async function () {
      assert.equal(
        micromark('<a href="foo">\n*bar*\n</a>', unsafe),
        '<a href="foo">\n*bar*\n</a>'
      )
    })

    await t.test('should support non-html tag names', async function () {
      assert.equal(
        micromark('<Warning>\n*bar*\n</Warning>', unsafe),
        '<Warning>\n*bar*\n</Warning>'
      )
    })

    await t.test(
      'should support non-“block” html tag names (1)',
      async function () {
        assert.equal(
          micromark('<i class="foo">\n*bar*\n</i>', unsafe),
          '<i class="foo">\n*bar*\n</i>'
        )
      }
    )

    await t.test(
      'should support non-“block” html tag names (2)',
      async function () {
        assert.equal(
          micromark('<del>\n*foo*\n</del>', unsafe),
          '<del>\n*foo*\n</del>'
        )
      }
    )

    await t.test('should support closing tags', async function () {
      assert.equal(micromark('</ins>\n*bar*', unsafe), '</ins>\n*bar*')
    })

    await t.test('should support interleaving', async function () {
      assert.equal(
        micromark('<del>\n\n*foo*\n\n</del>', unsafe),
        '<del>\n<p><em>foo</em></p>\n</del>'
      )
    })

    await t.test(
      'should not support interleaving w/o blank lines',
      async function () {
        assert.equal(
          micromark('<del>*foo*</del>', unsafe),
          '<p><del><em>foo</em></del></p>'
        )
      }
    )

    await t.test(
      'should support interleaving w/ whitespace-only blank lines',
      async function () {
        assert.equal(micromark('<div>\n  \nasd', unsafe), '<div>\n<p>asd</p>')
      }
    )

    await t.test(
      'should not support interrupting paragraphs w/ complete tags',
      async function () {
        assert.equal(
          micromark('Foo\n<a href="bar">\nbaz', unsafe),
          '<p>Foo\n<a href="bar">\nbaz</p>'
        )
      }
    )

    await t.test(
      'should not support an eof directly after a tag name',
      async function () {
        assert.equal(micromark('<x', unsafe), '<p>&lt;x</p>')
      }
    )

    await t.test(
      'should not support an eof directly after a self-closing slash',
      async function () {
        assert.equal(micromark('<x/', unsafe), '<p>&lt;x/</p>')
      }
    )

    await t.test(
      'should not support a line ending directly after a tag name',
      async function () {
        assert.equal(micromark('<x\n', unsafe), '<p>&lt;x</p>\n')
      }
    )

    await t.test(
      'should not support an eof after a space directly after a tag name',
      async function () {
        assert.equal(micromark('<x ', unsafe), '<p>&lt;x</p>')
      }
    )

    await t.test(
      'should not support an eof directly after a self-closing slash',
      async function () {
        assert.equal(micromark('<x/', unsafe), '<p>&lt;x/</p>')
      }
    )

    await t.test(
      'should not support a line ending after a self-closing slash',
      async function () {
        assert.equal(
          micromark('<x/\n*asd*', unsafe),
          '<p>&lt;x/\n<em>asd</em></p>'
        )
      }
    )

    await t.test(
      'should support an eof after a self-closing tag',
      async function () {
        assert.equal(micromark('<x/>', unsafe), '<x/>')
      }
    )

    await t.test(
      'should support a line ending after a self-closing tag',
      async function () {
        assert.equal(micromark('<x/>\na', unsafe), '<x/>\na')
      }
    )

    await t.test(
      'should not support another character after a self-closing tag',
      async function () {
        assert.equal(micromark('<x/>a', unsafe), '<p><x/>a</p>')
      }
    )

    await t.test(
      'should not support another character after an opening tag',
      async function () {
        assert.equal(micromark('<x>a', unsafe), '<p><x>a</p>')
      }
    )

    await t.test(
      'should support boolean attributes in a complete tag',
      async function () {
        assert.equal(micromark('<x y>', unsafe), '<x y>')
      }
    )

    await t.test(
      'should not support a line ending before an attribute name',
      async function () {
        assert.equal(micromark('<x\ny>', unsafe), '<p><x\ny></p>')
      }
    )

    await t.test(
      'should not support a line ending w/ whitespace before an attribute name',
      async function () {
        assert.equal(micromark('<x\n  y>', unsafe), '<p><x\ny></p>')
      }
    )

    await t.test(
      'should not support a line ending w/ whitespace and another line ending before an attribute name',
      async function () {
        assert.equal(
          micromark('<x\n  \ny>', unsafe),
          '<p>&lt;x</p>\n<p>y&gt;</p>'
        )
      }
    )

    await t.test(
      'should not support a line ending between attribute names',
      async function () {
        assert.equal(micromark('<x y\nz>', unsafe), '<p><x y\nz></p>')
      }
    )

    await t.test(
      'should support whitespace between attribute names',
      async function () {
        assert.equal(micromark('<x y   z>', unsafe), '<x y   z>')
      }
    )

    await t.test('should not support a colon in a tag name', async function () {
      assert.equal(micromark('<x:y>', unsafe), '<p>&lt;x:y&gt;</p>')
    })

    await t.test(
      'should not support an underscore in a tag name',
      async function () {
        assert.equal(micromark('<x_y>', unsafe), '<p>&lt;x_y&gt;</p>')
      }
    )

    await t.test('should not support a dot in a tag name', async function () {
      assert.equal(micromark('<x.y>', unsafe), '<p>&lt;x.y&gt;</p>')
    })

    await t.test(
      'should support a colon to start an attribute name',
      async function () {
        assert.equal(micromark('<x :y>', unsafe), '<x :y>')
      }
    )

    await t.test(
      'should support an underscore to start an attribute name',
      async function () {
        assert.equal(micromark('<x _y>', unsafe), '<x _y>')
      }
    )

    await t.test(
      'should not support a dot to start an attribute name',
      async function () {
        assert.equal(micromark('<x .y>', unsafe), '<p>&lt;x .y&gt;</p>')
      }
    )

    await t.test(
      'should support a colon to end an attribute name',
      async function () {
        assert.equal(micromark('<x y:>', unsafe), '<x y:>')
      }
    )

    await t.test(
      'should support an underscore to end an attribute name',
      async function () {
        assert.equal(micromark('<x y_>', unsafe), '<x y_>')
      }
    )

    await t.test(
      'should support a dot to end an attribute name',
      async function () {
        assert.equal(micromark('<x y.>', unsafe), '<x y.>')
      }
    )

    await t.test(
      'should support numbers to end an attribute name',
      async function () {
        assert.equal(micromark('<x y123>', unsafe), '<x y123>')
      }
    )

    await t.test(
      'should support a dash to end an attribute name',
      async function () {
        assert.equal(micromark('<x data->', unsafe), '<x data->')
      }
    )

    await t.test(
      'should not upport an initializer w/o a value',
      async function () {
        assert.equal(micromark('<x y=>', unsafe), '<p>&lt;x y=&gt;</p>')
      }
    )

    await t.test(
      'should not support an equals to as an initializer',
      async function () {
        assert.equal(micromark('<x y==>', unsafe), '<p>&lt;x y==&gt;</p>')
      }
    )

    await t.test(
      'should support a single character as an unquoted attribute value',
      async function () {
        assert.equal(micromark('<x y=z>', unsafe), '<x y=z>')
      }
    )

    await t.test(
      'should support an empty double quoted attribute value',
      async function () {
        assert.equal(micromark('<x y="">', unsafe), '<x y="">')
      }
    )

    await t.test(
      'should support an empty single quoted attribute value',
      async function () {
        assert.equal(micromark("<x y=''>", unsafe), "<x y=''>")
      }
    )

    await t.test(
      'should not support a line ending in a double quoted attribute value',
      async function () {
        assert.equal(micromark('<x y="\n">', unsafe), '<p><x y="\n"></p>')
      }
    )

    await t.test(
      'should not support a line ending in a single quoted attribute value',
      async function () {
        assert.equal(micromark("<x y='\n'>", unsafe), "<p><x y='\n'></p>")
      }
    )

    await t.test(
      'should not support a line ending in/after an unquoted attribute value',
      async function () {
        assert.equal(micromark('<w x=y\nz>', unsafe), '<p><w x=y\nz></p>')
      }
    )

    await t.test(
      'should not support a double quote in/after an unquoted attribute value',
      async function () {
        assert.equal(
          micromark('<w x=y"z>', unsafe),
          '<p>&lt;w x=y&quot;z&gt;</p>'
        )
      }
    )

    await t.test(
      'should not support a single quote in/after an unquoted attribute value',
      async function () {
        assert.equal(micromark("<w x=y'z>", unsafe), "<p>&lt;w x=y'z&gt;</p>")
      }
    )

    await t.test(
      'should not support an attribute after a double quoted attribute value',
      async function () {
        assert.equal(
          micromark('<x y=""z>', unsafe),
          '<p>&lt;x y=&quot;&quot;z&gt;</p>'
        )
      }
    )

    await t.test(
      'should not support blank lines in complete',
      async function () {
        assert.equal(
          micromark('<x>\n  \n  \n>', unsafe),
          '<x>\n<blockquote>\n</blockquote>'
        )
      }
    )

    await t.test('should not support lazyness (1)', async function () {
      assert.equal(
        micromark('> <a>\n*bar*', unsafe),
        '<blockquote>\n<a>\n</blockquote>\n<p><em>bar</em></p>'
      )
    })

    await t.test('should not support lazyness (2)', async function () {
      assert.equal(
        micromark('> a\n<a>', unsafe),
        '<blockquote>\n<p>a</p>\n</blockquote>\n<a>'
      )
    })
  })

  await t.test('should support turning off html (flow)', async function () {
    assert.equal(
      micromark('<x>', {extensions: [{disable: {null: ['htmlFlow']}}]}),
      '<p>&lt;x&gt;</p>'
    )
  })
})
