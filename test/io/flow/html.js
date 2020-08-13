'use strict'

var test = require('tape')
var m = require('../../..')

var unsafe = {allowDangerousHtml: true}

test('html', function (t) {
  t.test('1 (raw)', function (t) {
    t.equal(
      m(
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
      ].join('\n'),
      'should support raw pre tags (type 1)'
    )

    t.equal(
      m(
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
      ].join('\n'),
      'should support raw script tags'
    )

    t.equal(
      m(
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
      ].join('\n'),
      'should support raw style tags'
    )

    t.equal(
      m('<style\n  type="text/css">\n\nfoo', unsafe),
      '<style\n  type="text/css">\n\nfoo',
      'should support raw tags w/o ending'
    )

    t.equal(
      m('<style>p{color:red;}</style>\n*foo*', unsafe),
      '<style>p{color:red;}</style>\n<p><em>foo</em></p>',
      'should support raw tags w/ start and end on a single line'
    )

    t.equal(
      m('<script>\nfoo\n</script>1. *bar*', unsafe),
      '<script>\nfoo\n</script>1. *bar*',
      'should support raw tags w/ more data on ending line'
    )

    t.equal(
      m('<script', unsafe),
      '<script',
      'should support an eof directly after a raw tag name'
    )

    t.equal(
      m('</script\nmore', unsafe),
      '<p>&lt;/script\nmore</p>',
      'should not support a raw closing tag'
    )

    t.equal(
      m('<script/', unsafe),
      '<p>&lt;script/</p>',
      'should not support an eof after a self-closing slash'
    )

    t.equal(
      m('<script/\n*asd*', unsafe),
      '<p>&lt;script/\n<em>asd</em></p>',
      'should not support a line ending after a self-closing slash'
    )

    t.equal(
      m('<script/>', unsafe),
      '<script/>',
      'should support an eof after a self-closing tag'
    )

    t.equal(
      m('<script/>\na', unsafe),
      '<script/>\na',
      'should support a line ending after a self-closing tag'
    )

    t.equal(
      m('<script/>a', unsafe),
      '<p><script/>a</p>',
      'should not support other characters after a self-closing tag'
    )

    t.equal(
      m('<script>a', unsafe),
      '<script>a',
      'should support other characters after a raw opening tag'
    )

    // Extra.
    t.equal(
      m('Foo\n<script', unsafe),
      '<p>Foo</p>\n<script',
      'should support interrupting paragraphs w/ raw tags'
    )

    t.end()
  })

  t.test('2 (comment)', function (t) {
    t.equal(
      m('<!-- Foo\n\nbar\n   baz -->\nokay', unsafe),
      '<!-- Foo\n\nbar\n   baz -->\n<p>okay</p>',
      'should support comments (type 2)'
    )

    t.equal(
      m('<!-- foo -->*bar*\n*baz*', unsafe),
      '<!-- foo -->*bar*\n<p><em>baz</em></p>',
      'should support comments w/ start and end on a single line'
    )

    t.equal(
      m('<!-asd-->', unsafe),
      '<p>&lt;!-asd--&gt;</p>',
      'should not support a single dash to start comments'
    )

    t.equal(
      m('<!-->', unsafe),
      '<!-->',
      'should support comments where the start dashes are the end dashes (1)'
    )

    t.equal(
      m('<!--->', unsafe),
      '<!--->',
      'should support comments where the start dashes are the end dashes (2)'
    )

    t.equal(m('<!---->', unsafe), '<!---->', 'should support empty comments')

    t.equal(
      m('  <!-- foo -->', unsafe),
      '  <!-- foo -->',
      'should support comments w/ indent'
    )

    t.equal(
      m('    <!-- foo -->', unsafe),
      '<pre><code>&lt;!-- foo --&gt;\n</code></pre>',
      'should not support comments w/ a 4 character indent'
    )

    // Extra.
    t.equal(
      m('Foo\n<!--', unsafe),
      '<p>Foo</p>\n<!--',
      'should support interrupting paragraphs w/ comments'
    )

    t.end()
  })

  t.test('3 (instruction)', function (t) {
    t.equal(
      m("<?php\n\n  echo '>';\n\n?>\nokay", unsafe),
      "<?php\n\n  echo '>';\n\n?>\n<p>okay</p>",
      'should support instructions (type 3)'
    )

    t.equal(
      m('<?>', unsafe),
      '<?>',
      'should support empty instructions where the `?` is part of both the start and the end'
    )

    t.equal(m('<??>', unsafe), '<??>', 'should support empty instructions')

    // Extra.
    t.equal(
      m('Foo\n<?', unsafe),
      '<p>Foo</p>\n<?',
      'should support interrupting paragraphs w/ instructions'
    )

    t.end()
  })

  t.test('4 (declaration)', function (t) {
    t.equal(
      m('<!DOCTYPE html>', unsafe),
      '<!DOCTYPE html>',
      'should support declarations (type 4)'
    )

    t.equal(
      m('<!123>', unsafe),
      '<p>&lt;!123&gt;</p>',
      'should not support declarations that start w/o an alpha'
    )

    t.equal(
      m('<!>', unsafe),
      '<p>&lt;!&gt;</p>',
      'should not support declarations w/o an identifier'
    )

    t.equal(
      m('<!a>', unsafe),
      '<!a>',
      'should support declarations w/o a single alpha as identifier'
    )

    // Extra.
    t.equal(
      m('Foo\n<!d', unsafe),
      '<p>Foo</p>\n<!d',
      'should support interrupting paragraphs w/ declarations'
    )

    t.end()
  })

  t.test('5 (cdata)', function (t) {
    t.equal(
      m(
        '<![CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]>\nokay',
        unsafe
      ),
      '<![CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]>\n<p>okay</p>',
      'should support cdata (type 5)'
    )

    t.equal(
      m('<![CDATA[]]>', unsafe),
      '<![CDATA[]]>',
      'should support empty cdata'
    )

    t.equal(
      m('<![CDATA]]>', unsafe),
      '<p>&lt;![CDATA]]&gt;</p>',
      'should not support cdata w/ a missing `[`'
    )

    t.equal(
      m('<![CDATA[]]]>', unsafe),
      '<![CDATA[]]]>',
      'should support cdata w/ a single `]` as content'
    )

    // Extra.
    t.equal(
      m('Foo\n<![CDATA[', unsafe),
      '<p>Foo</p>\n<![CDATA[',
      'should support interrupting paragraphs w/ cdata'
    )

    // Note: cmjs parses this differently.
    // See: <https://github.com/commonmark/commonmark.js/issues/193>
    t.equal(
      m('<![cdata[]]>', unsafe),
      '<p>&lt;![cdata[]]&gt;</p>',
      'should not support lowercase cdata'
    )

    t.end()
  })

  t.test('6 (basic)', function (t) {
    t.equal(
      m(
        '<table><tr><td>\n<pre>\n**Hello**,\n\n_world_.\n</pre>\n</td></tr></table>',
        unsafe
      ),
      '<table><tr><td>\n<pre>\n**Hello**,\n<p><em>world</em>.\n</pre></p>\n</td></tr></table>',
      'should support html (basic)'
    )

    t.equal(
      m(
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
      ].join('\n'),
      'should support html of type 6 (1)'
    )

    t.equal(
      m(' <div>\n  *hello*\n         <foo><a>', unsafe),
      ' <div>\n  *hello*\n         <foo><a>',
      'should support html of type 6 (2)'
    )

    t.equal(
      m('</div>\n*foo*', unsafe),
      '</div>\n*foo*',
      'should support html starting w/ a closing tag'
    )

    t.equal(
      m('<DIV CLASS="foo">\n\n*Markdown*\n\n</DIV>', unsafe),
      '<DIV CLASS="foo">\n<p><em>Markdown</em></p>\n</DIV>',
      'should support html w/ markdown in between'
    )

    t.equal(
      m('<div id="foo"\n  class="bar">\n</div>', unsafe),
      '<div id="foo"\n  class="bar">\n</div>',
      'should support html w/ line endings (1)'
    )

    t.equal(
      m('<div id="foo" class="bar\n  baz">\n</div>', unsafe),
      '<div id="foo" class="bar\n  baz">\n</div>',
      'should support html w/ line endings (2)'
    )

    t.equal(
      m('<div>\n*foo*\n\n*bar*', unsafe),
      '<div>\n*foo*\n<p><em>bar</em></p>',
      'should support an unclosed html element'
    )

    t.equal(
      m('<div id="foo"\n*hi*', unsafe),
      '<div id="foo"\n*hi*',
      'should support garbage html (1)'
    )

    t.equal(
      m('<div class\nfoo', unsafe),
      '<div class\nfoo',
      'should support garbage html (2)'
    )

    t.equal(
      m('<div *???-&&&-<---\n*foo*', unsafe),
      '<div *???-&&&-<---\n*foo*',
      'should support garbage html (3)'
    )

    t.equal(
      m('<div><a href="bar">*foo*</a></div>', unsafe),
      '<div><a href="bar">*foo*</a></div>',
      'should support other tags in the opening (1)'
    )

    t.equal(
      m('<table><tr><td>\nfoo\n</td></tr></table>', unsafe),
      '<table><tr><td>\nfoo\n</td></tr></table>',
      'should support other tags in the opening (2)'
    )

    t.equal(
      m('<div></div>\n``` c\nint x = 33;\n```', unsafe),
      '<div></div>\n``` c\nint x = 33;\n```',
      'should include everything ’till a blank line'
    )

    t.equal(
      m('> <div>\n> foo\n\nbar', unsafe),
      '<blockquote>\n<div>\nfoo\n</blockquote>\n<p>bar</p>',
      'should support basic tags w/o ending in containers (1)'
    )

    t.equal(
      m('- <div>\n- foo', unsafe),
      '<ul>\n<li>\n<div>\n</li>\n<li>foo</li>\n</ul>',
      'should support basic tags w/o ending in containers (2)'
    )

    t.equal(
      m('  <div>', unsafe),
      '  <div>',
      'should support basic tags w/ indent'
    )

    t.equal(
      m('    <div>', unsafe),
      '<pre><code>&lt;div&gt;\n</code></pre>',
      'should not support basic tags w/ a 4 character indent'
    )

    t.equal(
      m('Foo\n<div>\nbar\n</div>', unsafe),
      '<p>Foo</p>\n<div>\nbar\n</div>',
      'should support interrupting paragraphs w/ basic tags'
    )

    t.equal(
      m('<div>\nbar\n</div>\n*foo*', unsafe),
      '<div>\nbar\n</div>\n*foo*',
      'should require a blank line to end'
    )

    t.equal(
      m('<div>\n\n*Emphasized* text.\n\n</div>', unsafe),
      '<div>\n<p><em>Emphasized</em> text.</p>\n</div>',
      'should support interleaving w/ blank lines'
    )

    t.equal(
      m('<div>\n*Emphasized* text.\n</div>', unsafe),
      '<div>\n*Emphasized* text.\n</div>',
      'should not support interleaving w/o blank lines'
    )

    t.equal(
      m('<table>\n\n<tr>\n\n<td>\nHi\n</td>\n\n</tr>\n\n</table>', unsafe),
      '<table>\n<tr>\n<td>\nHi\n</td>\n</tr>\n</table>',
      'should support blank lines between adjacent html'
    )

    t.equal(
      m(
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
      ].join('\n'),
      'should not support indented, blank-line delimited, adjacent html'
    )

    t.equal(
      m('</1>', unsafe),
      '<p>&lt;/1&gt;</p>',
      'should not support basic tags w/ an incorrect name start character'
    )

    t.equal(
      m('<div', unsafe),
      '<div',
      'should support an eof directly after a basic tag name'
    )

    t.equal(
      m('<div\n', unsafe),
      '<div\n',
      'should support a line ending directly after a tag name'
    )

    t.equal(
      m('<div ', unsafe),
      '<div ',
      'should support an eof after a space directly after a tag name'
    )

    t.equal(
      m('<div/', unsafe),
      '<p>&lt;div/</p>',
      'should not support an eof directly after a self-closing slash'
    )

    t.equal(
      m('<div/\n*asd*', unsafe),
      '<p>&lt;div/\n<em>asd</em></p>',
      'should not support a line ending after a self-closing slash'
    )

    t.equal(
      m('<div/>', unsafe),
      '<div/>',
      'should support an eof after a self-closing tag'
    )

    t.equal(
      m('<div/>\na', unsafe),
      '<div/>\na',
      'should support a line ending after a self-closing tag'
    )

    t.equal(
      m('<div/>a', unsafe),
      '<div/>a',
      'should support another character after a self-closing tag'
    )

    t.equal(
      m('<div>a', unsafe),
      '<div>a',
      'should support another character after a basic opening tag'
    )

    // Extra.
    t.equal(
      m('Foo\n<div/>', unsafe),
      '<p>Foo</p>\n<div/>',
      'should support interrupting paragraphs w/ self-closing basic tags'
    )

    t.end()
  })

  t.test('7 (complete)', function (t) {
    t.equal(
      m('<a href="foo">\n*bar*\n</a>', unsafe),
      '<a href="foo">\n*bar*\n</a>',
      'should support complete tags (type 7)'
    )

    t.equal(
      m('<Warning>\n*bar*\n</Warning>', unsafe),
      '<Warning>\n*bar*\n</Warning>',
      'should support non-html tag names'
    )

    t.equal(
      m('<i class="foo">\n*bar*\n</i>', unsafe),
      '<i class="foo">\n*bar*\n</i>',
      'should support non-“block” html tag names (1)'
    )

    t.equal(
      m('<del>\n*foo*\n</del>', unsafe),
      '<del>\n*foo*\n</del>',
      'should support non-“block” html tag names (2)'
    )

    t.equal(
      m('</ins>\n*bar*', unsafe),
      '</ins>\n*bar*',
      'should support closing tags'
    )

    t.equal(
      m('<del>\n\n*foo*\n\n</del>', unsafe),
      '<del>\n<p><em>foo</em></p>\n</del>',
      'should support interleaving'
    )

    t.equal(
      m('<del>*foo*</del>', unsafe),
      '<p><del><em>foo</em></del></p>',
      'should not support interleaving w/o blank lines'
    )

    t.equal(
      m('<div>\n  \nasd', unsafe),
      '<div>\n<p>asd</p>',
      'should support interleaving w/ whitespace-only blank lines'
    )

    t.equal(
      m('Foo\n<a href="bar">\nbaz', unsafe),
      '<p>Foo\n<a href="bar">\nbaz</p>',
      'should not support interrupting paragraphs w/ complete tags'
    )

    t.equal(
      m('<x', unsafe),
      '<p>&lt;x</p>',
      'should not support an eof directly after a tag name'
    )

    t.equal(
      m('<x/', unsafe),
      '<p>&lt;x/</p>',
      'should not support an eof directly after a self-closing slash'
    )

    t.equal(
      m('<x\n', unsafe),
      '<p>&lt;x</p>\n',
      'should not support a line ending directly after a tag name'
    )

    t.equal(
      m('<x ', unsafe),
      '<p>&lt;x</p>',
      'should not support an eof after a space directly after a tag name'
    )

    t.equal(
      m('<x/', unsafe),
      '<p>&lt;x/</p>',
      'should not support an eof directly after a self-closing slash'
    )

    t.equal(
      m('<x/\n*asd*', unsafe),
      '<p>&lt;x/\n<em>asd</em></p>',
      'should not support a line ending after a self-closing slash'
    )

    t.equal(
      m('<x/>', unsafe),
      '<x/>',
      'should support an eof after a self-closing tag'
    )

    t.equal(
      m('<x/>\na', unsafe),
      '<x/>\na',
      'should support a line ending after a self-closing tag'
    )

    t.equal(
      m('<x/>a', unsafe),
      '<p><x/>a</p>',
      'should not support another character after a self-closing tag'
    )

    t.equal(
      m('<x>a', unsafe),
      '<p><x>a</p>',
      'should not support another character after an opening tag'
    )

    t.equal(
      m('<x y>', unsafe),
      '<x y>',
      'should support boolean attributes in a complete tag'
    )

    t.equal(
      m('<x\ny>', unsafe),
      '<p><x\ny></p>',
      'should not support a line ending before an attribute name'
    )

    t.equal(
      m('<x\n  y>', unsafe),
      '<p><x\ny></p>',
      'should not support a line ending w/ whitespace before an attribute name'
    )

    t.equal(
      m('<x\n  \ny>', unsafe),
      '<p>&lt;x</p>\n<p>y&gt;</p>',
      'should not support a line ending w/ whitespace and another line ending before an attribute name'
    )

    t.equal(
      m('<x y\nz>', unsafe),
      '<p><x y\nz></p>',
      'should not support a line ending between attribute names'
    )

    t.equal(
      m('<x y   z>', unsafe),
      '<x y   z>',
      'should support whitespace between attribute names'
    )

    t.equal(
      m('<x:y>', unsafe),
      '<p>&lt;x:y&gt;</p>',
      'should not support a colon in a tag name'
    )

    t.equal(
      m('<x_y>', unsafe),
      '<p>&lt;x_y&gt;</p>',
      'should not support an underscore in a tag name'
    )

    t.equal(
      m('<x.y>', unsafe),
      '<p>&lt;x.y&gt;</p>',
      'should not support a dot in a tag name'
    )

    t.equal(
      m('<x :y>', unsafe),
      '<x :y>',
      'should support a colon to start an attribute name'
    )

    t.equal(
      m('<x _y>', unsafe),
      '<x _y>',
      'should support an underscore to start an attribute name'
    )

    t.equal(
      m('<x .y>', unsafe),
      '<p>&lt;x .y&gt;</p>',
      'should not support a dot to start an attribute name'
    )

    t.equal(
      m('<x y:>', unsafe),
      '<x y:>',
      'should support a colon to end an attribute name'
    )

    t.equal(
      m('<x y_>', unsafe),
      '<x y_>',
      'should support an underscore to end an attribute name'
    )

    t.equal(
      m('<x y.>', unsafe),
      '<x y.>',
      'should support a dot to end an attribute name'
    )

    t.equal(
      m('<x y123>', unsafe),
      '<x y123>',
      'should support numbers to end an attribute name'
    )

    t.equal(
      m('<x data->', unsafe),
      '<x data->',
      'should support a dash to end an attribute name'
    )

    t.equal(
      m('<x y=>', unsafe),
      '<p>&lt;x y=&gt;</p>',
      'should not upport an initializer w/o a value'
    )

    t.equal(
      m('<x y==>', unsafe),
      '<p>&lt;x y==&gt;</p>',
      'should not support an equals to as an initializer'
    )

    t.equal(
      m('<x y=z>', unsafe),
      '<x y=z>',
      'should support a single character as an unquoted attribute value'
    )

    t.equal(
      m('<x y="">', unsafe),
      '<x y="">',
      'should support an empty double quoted attribute value'
    )

    t.equal(
      m("<x y=''>", unsafe),
      "<x y=''>",
      'should support an empty single quoted attribute value'
    )

    t.equal(
      m('<x y="\n">', unsafe),
      '<p><x y="\n"></p>',
      'should not support a line ending in a double quoted attribute value'
    )

    t.equal(
      m("<x y='\n'>", unsafe),
      "<p><x y='\n'></p>",
      'should not support a line ending in a single quoted attribute value'
    )

    t.equal(
      m('<w x=y\nz>', unsafe),
      '<p><w x=y\nz></p>',
      'should not support a line ending in/after an unquoted attribute value'
    )

    t.equal(
      m('<w x=y"z>', unsafe),
      '<p>&lt;w x=y&quot;z&gt;</p>',
      'should not support a double quote in/after an unquoted attribute value'
    )

    t.equal(
      m("<w x=y'z>", unsafe),
      "<p>&lt;w x=y'z&gt;</p>",
      'should not support a single quote in/after an unquoted attribute value'
    )

    t.equal(
      m('<x y=""z>', unsafe),
      '<p>&lt;x y=&quot;&quot;z&gt;</p>',
      'should not support an attribute after a double quoted attribute value'
    )

    t.end()
  })

  t.end()
})
