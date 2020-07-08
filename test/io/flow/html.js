'use strict'

var test = require('tape')
var m = require('../../..')

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
        ].join('\n')
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
        ].join('\n')
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
        ].join('\n')
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
      m('<style\n  type="text/css">\n\nfoo'),
      '<style\n  type="text/css">\n\nfoo',
      'should support raw tags w/o ending'
    )

    t.equal(
      m('<style>p{color:red;}</style>\n*foo*'),
      '<style>p{color:red;}</style>\n<p><em>foo</em></p>',
      'should support raw tags w/ ending on initial line'
    )

    t.equal(
      m('<script>\nfoo\n</script>1. *bar*'),
      '<script>\nfoo\n</script>1. *bar*',
      'should support raw tags w/ trailing final data'
    )

    t.equal(
      m('<script'),
      '<script',
      'should support an EOF directly after a tag name'
    )

    t.equal(
      m('</script\nmore'),
      '<p>&lt;/script\nmore</p>',
      'should not support a raw closing tag to start a block of html'
    )

    t.equal(
      m('<script/'),
      '<p>&lt;script/</p>',
      'should not support an EOF after a self-closing solidus to start html'
    )

    t.equal(
      m('<script/\n*asd*'),
      '<p>&lt;script/\n<em>asd</em></p>',
      'should not support an EOL after a self-closing solidus to start html'
    )

    t.equal(
      m('<script/>'),
      '<script/>',
      'should support an EOF after a self-closing tag to start html'
    )

    t.equal(
      m('<script/>\na'),
      '<script/>\na',
      'should support an EOL after a self-closing tag to start html'
    )

    t.equal(
      m('<script/>a'),
      '<p><script/>a</p>',
      'should not support another character after a self-closing tag to start html'
    )

    t.equal(
      m('<script>a'),
      '<script>a',
      'should support another character after an opening tag to start html'
    )

    t.end()
  })

  t.test('2 (comment)', function (t) {
    t.equal(
      m('<!-- Foo\n\nbar\n   baz -->\nokay'),
      '<!-- Foo\n\nbar\n   baz -->\n<p>okay</p>',
      'should support comments (type 2)'
    )

    t.equal(
      m('<!-- foo -->*bar*\n*baz*'),
      '<!-- foo -->*bar*\n<p><em>baz</em></p>',
      'should support comments w/ ending on initial line'
    )

    t.equal(
      m('<!-asd-->'),
      '<p>&lt;!-asd--&gt;</p>',
      'should not support comment that don’t start with two dashes'
    )

    t.equal(
      m('<!-->'),
      '<!-->',
      'should support empty comments where the start dashes are the end dashes (1)'
    )

    t.equal(
      m('<!--->'),
      '<!--->',
      'should support empty comments where the start dashes are the end dashes (2)'
    )

    t.equal(m('<!---->'), '<!---->', 'should support empty comments')

    t.equal(
      m('  <!-- foo -->'),
      '  <!-- foo -->',
      'should support comments w/ indent'
    )

    t.equal(
      m('    <!-- foo -->'),
      '<pre><code>&lt;!-- foo --&gt;\n</code></pre>',
      'should not support comments w/ a 4 character indent'
    )

    t.end()
  })

  t.test('3 (instruction)', function (t) {
    t.equal(
      m("<?php\n\n  echo '>';\n\n?>\nokay"),
      "<?php\n\n  echo '>';\n\n?>\n<p>okay</p>",
      'should support instructions (type 3)'
    )

    t.equal(
      m('<?>'),
      '<?>',
      'should support empty instructions where the `?` is part of both the start and the end'
    )

    t.equal(m('<??>'), '<??>', 'should support empty instructions')

    t.end()
  })

  t.test('4 (declaration)', function (t) {
    t.equal(
      m('<!DOCTYPE html>'),
      '<!DOCTYPE html>',
      'should support declarations (type 4)'
    )

    t.equal(
      m('<!123>'),
      '<p>&lt;!123&gt;</p>',
      'should not support declarations that don’t start with a letter'
    )

    t.equal(m('<!a>'), '<!a>', 'should support otherwise empty declarations')

    t.end()
  })

  t.test('5 (cdata)', function (t) {
    t.equal(
      m(
        '<![CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]>\nokay'
      ),
      '<![CDATA[\nfunction matchwo(a,b)\n{\n  if (a < b && a < 0) then {\n    return 1;\n\n  } else {\n\n    return 0;\n  }\n}\n]]>\n<p>okay</p>',
      'should support cdata (type 5)'
    )

    t.equal(m('<![CDATA[]]>'), '<![CDATA[]]>', 'should support empty cdata')

    t.equal(
      m('<![CDATA]]>'),
      '<p>&lt;![CDATA]]&gt;</p>',
      'should not support cdata with a missing `[`'
    )

    t.equal(
      m('<![CDATA[]]]>'),
      '<![CDATA[]]]>',
      'should support cdata with a single `]`'
    )

    t.end()
  })

  t.test('6 (basic)', function (t) {
    t.equal(
      m(
        '<table><tr><td>\n<pre>\n**Hello**,\n\n_world_.\n</pre>\n</td></tr></table>'
      ),
      '<table><tr><td>\n<pre>\n**Hello**,\n<p><em>world</em>.\n</pre></p>\n</td></tr></table>',
      'should support html (complex)'
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
        ].join('\n')
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
      m(' <div>\n  *hello*\n         <foo><a>'),
      ' <div>\n  *hello*\n         <foo><a>',
      'should support html of type 6 (2)'
    )

    t.equal(
      m('</div>\n*foo*'),
      '</div>\n*foo*',
      'should support flow HTML starting with a closing tag'
    )

    t.equal(
      m('<DIV CLASS="foo">\n\n*Markdown*\n\n</DIV>'),
      '<DIV CLASS="foo">\n<p><em>Markdown</em></p>\n</DIV>',
      'should support flow HTML with markdown in between'
    )

    t.equal(
      m('<div id="foo"\n  class="bar">\n</div>'),
      '<div id="foo"\n  class="bar">\n</div>',
      'should support flow HTML with line endings (1)'
    )

    t.equal(
      m('<div id="foo" class="bar\n  baz">\n</div>'),
      '<div id="foo" class="bar\n  baz">\n</div>',
      'should support flow HTML with line endings (2)'
    )

    t.equal(
      m('<div>\n*foo*\n\n*bar*'),
      '<div>\n*foo*\n<p><em>bar</em></p>',
      'should support an unclosed flow HTML opening tag'
    )

    t.equal(
      m('<div id="foo"\n*hi*'),
      '<div id="foo"\n*hi*',
      'should support garbage html (1)'
    )

    t.equal(
      m('<div class\nfoo'),
      '<div class\nfoo',
      'should support garbage html (2)'
    )

    t.equal(
      m('<div *???-&&&-<---\n*foo*'),
      '<div *???-&&&-<---\n*foo*',
      'should support garbage html (3)'
    )

    t.equal(
      m('<div *???-&&&-<---\n*foo*'),
      '<div *???-&&&-<---\n*foo*',
      'should support garbage html (3)'
    )

    t.equal(
      m('<div><a href="bar">*foo*</a></div>'),
      '<div><a href="bar">*foo*</a></div>',
      'should support other tags in the opening (1)'
    )

    t.equal(
      m('<table><tr><td>\nfoo\n</td></tr></table>'),
      '<table><tr><td>\nfoo\n</td></tr></table>',
      'should support other tags in the opening (2)'
    )

    t.equal(
      m('<div></div>\n``` c\nint x = 33;\n```'),
      '<div></div>\n``` c\nint x = 33;\n```',
      'should include everything to a blank line'
    )

    // To do: block quote
    // t.equal(
    //   m('> <div>\n> foo\n\nbar'),
    //   '<blockquote>\n<div>\nfoo\n</blockquote>\n<p>bar</p>',
    //   'should support basic tags without ending in containers (1)'
    // )

    // To do: list
    // t.equal(
    //   m('- <div>\n- foo'),
    //   '<ul>\n<li>\n<div>\n</li>\n<li>foo</li>\n</ul>',
    //   'should support basic tags without ending in containers (2)'
    // )

    t.equal(m('  <div>'), '  <div>', 'should support basic tags w/ indent')

    t.equal(
      m('    <div>'),
      '<pre><code>&lt;div&gt;\n</code></pre>',
      'should not support basic tags w/ a 4 character indent'
    )

    t.equal(
      m('Foo\n<div>\nbar\n</div>'),
      '<p>Foo</p>\n<div>\nbar\n</div>',
      'should support interrupting paragraphs w/ basic tags'
    )

    t.equal(
      m('<div>\nbar\n</div>\n*foo*'),
      '<div>\nbar\n</div>\n*foo*',
      'should require a blank line to end'
    )

    t.equal(
      m('<div>\n\n*Emphasized* text.\n\n</div>'),
      '<div>\n<p><em>Emphasized</em> text.</p>\n</div>',
      'should support interleaving w/ blank lines'
    )

    t.equal(
      m('<div>\n*Emphasized* text.\n</div>'),
      '<div>\n*Emphasized* text.\n</div>',
      'should not support interleaving w/o blank lines'
    )

    t.equal(
      m('<table>\n\n<tr>\n\n<td>\nHi\n</td>\n\n</tr>\n\n</table>'),
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
        ].join('\n')
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
      m('</1>'),
      '<p>&lt;/1&gt;</p>',
      'should not support basic tags with an incorrect name start character'
    )

    t.equal(
      m('<div'),
      '<div',
      'should support an EOF directly after a tag name'
    )

    t.equal(
      m('<div\n'),
      '<div\n',
      'should support an EOL directly after a tag name'
    )

    t.equal(
      m('<div '),
      '<div ',
      'should support an EOF after a space directly after a tag name'
    )

    t.equal(
      m('<div/'),
      '<p>&lt;div/</p>',
      'should not support an EOF directly after a closing slash'
    )

    t.equal(
      m('<div/\n*asd*'),
      '<p>&lt;div/\n<em>asd</em></p>',
      'should not support an EOL after a self-closing solidus to start html'
    )

    t.equal(
      m('<div/>'),
      '<div/>',
      'should support an EOF after a self-closing tag to start html'
    )

    t.equal(
      m('<div/>\na'),
      '<div/>\na',
      'should support an EOL after a self-closing tag to start html'
    )

    t.equal(
      m('<div/>a'),
      '<div/>a',
      'should support another character after a self-closing tag to start html'
    )

    t.equal(
      m('<div>a'),
      '<div>a',
      'should support another character after an opening tag to start html'
    )

    t.end()
  })

  t.test('7', function (t) {
    t.equal(
      m('<a href="foo">\n*bar*\n</a>'),
      '<a href="foo">\n*bar*\n</a>',
      'should support complete tags (type 7)'
    )

    t.equal(
      m('<Warning>\n*bar*\n</Warning>'),
      '<Warning>\n*bar*\n</Warning>',
      'should support non-HTML tag names'
    )

    t.equal(
      m('<i class="foo">\n*bar*\n</i>'),
      '<i class="foo">\n*bar*\n</i>',
      'should support non-block HTML tag names (1)'
    )

    t.equal(
      m('<del>\n*foo*\n</del>'),
      '<del>\n*foo*\n</del>',
      'should support non-block HTML tag names (2)'
    )

    t.equal(
      m('</ins>\n*bar*'),
      '</ins>\n*bar*',
      'should support closing tags to start HTML'
    )

    t.equal(
      m('<del>\n\n*foo*\n\n</del>'),
      '<del>\n<p><em>foo</em></p>\n</del>',
      'should support interleaving'
    )

    t.equal(
      m('<del>*foo*</del>'),
      '<p><del><em>foo</em></del></p>',
      'should not support interleaving w/o blank lines'
    )

    t.equal(
      m('Foo\n<a href="bar">\nbaz'),
      '<p>Foo\n<a href="bar">\nbaz</p>',
      'should not support interrupting paragraphs w/ complete tags'
    )

    t.equal(
      m('<x'),
      '<p>&lt;x</p>',
      'should not support an EOF directly after a tag name'
    )

    t.equal(
      m('<x/'),
      '<p>&lt;x/</p>',
      'should not support an EOF directly after a closing slash'
    )

    t.equal(
      m('<x\n'),
      '<p>&lt;x</p>\n',
      'should not support an EOL directly after a tag name'
    )

    // To do: trailing whitespace not part of paragraph.
    // t.equal(
    //   m('<x '),
    //   '<p>&lt;x</p>',
    //   'should not support an EOF after a space directly after a tag name'
    // )

    t.equal(
      m('<x/'),
      '<p>&lt;x/</p>',
      'should not support an EOF directly after a closing slash'
    )

    t.equal(
      m('<x/\n*asd*'),
      '<p>&lt;x/\n<em>asd</em></p>',
      'should not support an EOL after a self-closing solidus to start html'
    )

    t.equal(
      m('<x/>'),
      '<x/>',
      'should support an EOF after a self-closing tag to start html'
    )

    t.equal(
      m('<x/>\na'),
      '<x/>\na',
      'should support an EOL after a self-closing tag to start html'
    )

    t.equal(
      m('<x/>a'),
      '<p><x/>a</p>',
      'should not support another character after a self-closing tag to start html'
    )

    t.equal(
      m('<x>a'),
      '<p><x>a</p>',
      'should not support another character after an opening tag to start html'
    )

    t.equal(
      m('<x y>'),
      '<x y>',
      'should support boolean attributes in a complete tag'
    )

    t.equal(
      m('<x\ny>'),
      '<p><x\ny></p>',
      'should not support an EOL before an attribute name'
    )

    // // To do: whitespace trimming
    // t.equal(
    //   m('<x\n  y>'),
    //   '<p><x\ny></p>',
    //   'should not support an EOL w/ whitespace before an attribute name'
    // )

    t.equal(
      m('<x\n  \ny>'),
      '<p>&lt;x</p>\n<p>y&gt;</p>',
      'should not support an EOL with whitespace and another EOL before an attribute name'
    )

    t.equal(
      m('<x y\nz>'),
      '<p><x y\nz></p>',
      'should not support an EOL between attribute names'
    )

    t.equal(
      m('<x y   z>'),
      '<x y   z>',
      'should support whitespace between attribute names'
    )

    t.equal(
      m('<x:y>'),
      '<p>&lt;x:y&gt;</p>',
      'should not support a colon in a tag name'
    )

    t.equal(
      m('<x_y>'),
      '<p>&lt;x_y&gt;</p>',
      'should not support an underscore in a tag name'
    )

    t.equal(
      m('<x.y>'),
      '<p>&lt;x.y&gt;</p>',
      'should not support a dot in a tag name'
    )

    t.equal(
      m('<x :y>'),
      '<x :y>',
      'should support a colon to start an attribute name'
    )

    t.equal(
      m('<x _y>'),
      '<x _y>',
      'should support an underscore to start an attribute name'
    )

    t.equal(
      m('<x .y>'),
      '<p>&lt;x .y&gt;</p>',
      'should not support a dot to start an attribute name'
    )

    t.equal(
      m('<x y:>'),
      '<x y:>',
      'should support a colon to end an attribute name'
    )

    t.equal(
      m('<x y_>'),
      '<x y_>',
      'should support an underscore to end an attribute name'
    )

    t.equal(
      m('<x y.>'),
      '<x y.>',
      'should support a dot to end an attribute name'
    )

    t.equal(
      m('<x y123>'),
      '<x y123>',
      'should support numbers to end an attribute name'
    )

    t.equal(
      m('<x data->'),
      '<x data->',
      'should support a dash to end an attribute name'
    )

    t.equal(
      m('<x y=>'),
      '<p>&lt;x y=&gt;</p>',
      'should not upport an initializer without a value'
    )

    t.equal(
      m('<x y==>'),
      '<p>&lt;x y==&gt;</p>',
      'should not support an equals to as an initializer'
    )

    t.equal(
      m('<x y=z>'),
      '<x y=z>',
      'should support a single character as an unquoted attribute value'
    )

    t.equal(
      m('<x y="">'),
      '<x y="">',
      'should support an empty double quoted attribute value'
    )

    t.equal(
      m("<x y=''>"),
      "<x y=''>",
      'should support an empty single quoted attribute value'
    )

    t.equal(
      m('<x y="\n">'),
      '<p><x y="\n"></p>',
      'should not support a line feed in a double quoted attribute value'
    )

    t.equal(
      m("<x y='\n'>"),
      "<p><x y='\n'></p>",
      'should not support a line feed in a single quoted attribute value'
    )

    t.equal(
      m('<w x=y\nz>'),
      '<p><w x=y\nz></p>',
      'should not support a line feed in/after an unquoted attribute value'
    )

    t.equal(
      m('<w x=y"z>'),
      '<p>&lt;w x=y&quot;z&gt;</p>',
      'should not support a double quote in/after an unquoted attribute value'
    )

    t.equal(
      m("<w x=y'z>"),
      "<p>&lt;w x=y'z&gt;</p>",
      'should not support a single quote in/after an unquoted attribute value'
    )

    t.equal(
      m('<x y=""z>'),
      '<p>&lt;x y=&quot;&quot;z&gt;</p>',
      'should not support an attribute after a double quoted attribute value'
    )

    t.end()
  })

  t.end()
})
