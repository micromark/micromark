'use strict'

var test = require('tape')
var m = require('../../..')

test('character-reference', function (t) {
  t.equal(
    m(
      [
        '&nbsp; &amp; &copy; &AElig; &Dcaron;',
        '&frac34; &HilbertSpace; &DifferentialD;',
        '&ClockwiseContourIntegral; &ngE;'
      ].join('\n')
    ),
    '<p>  &amp; © Æ Ď\n¾ ℋ ⅆ\n∲ ≧̸</p>',
    'should support named character references'
  )

  t.equal(
    m('&#35; &#1234; &#992; &#0;'),
    '<p># Ӓ Ϡ �</p>',
    'should support decimal character references'
  )

  t.equal(
    m('&#X22; &#XD06; &#xcab;'),
    '<p>&quot; ആ ಫ</p>',
    'should support hexadecimal character references'
  )

  t.equal(
    m(
      [
        '&nbsp &x; &#; &#x;',
        '&#987654321;',
        '&#abcdef0;',
        '&ThisIsNotDefined; &hi?;'
      ].join('\n')
    ),
    [
      '<p>&amp;nbsp &amp;x; &amp;#; &amp;#x;',
      '&amp;#987654321;',
      '&amp;#abcdef0;',
      '&amp;ThisIsNotDefined; &amp;hi?;</p>'
    ].join('\n'),
    'should not support other things that look like character references'
  )

  t.equal(
    m('&copy'),
    '<p>&amp;copy</p>',
    'should not support character references w/o semicolon'
  )

  t.equal(
    m('&MadeUpEntity;'),
    '<p>&amp;MadeUpEntity;</p>',
    'should not support unknown named character references'
  )

  t.equal(
    m('<a href="&ouml;&ouml;.html">', {allowDangerousHtml: true}),
    '<a href="&ouml;&ouml;.html">',
    'should not care about character references in html'
  )

  t.equal(
    m('[foo](/f&ouml;&ouml; "f&ouml;&ouml;")'),
    '<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>',
    'should support character references in resource URLs and titles'
  )

  t.equal(
    m('[foo]: /f&ouml;&ouml; "f&ouml;&ouml;"\n\n[foo]'),
    '<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>',
    'should support character references in definition URLs and titles'
  )

  t.equal(
    m('``` f&ouml;&ouml;\nfoo\n```'),
    '<pre><code class="language-föö">foo\n</code></pre>',
    'should support character references in code language'
  )

  t.equal(
    m('`f&ouml;&ouml;`'),
    '<p><code>f&amp;ouml;&amp;ouml;</code></p>',
    'should not support character references in text code'
  )

  t.equal(
    m('    f&ouml;f&ouml;'),
    '<pre><code>f&amp;ouml;f&amp;ouml;\n</code></pre>',
    'should not support character references in indented block code'
  )

  t.equal(
    m('&#42;foo&#42;\n*foo*'),
    '<p>*foo*\n<em>foo</em></p>',
    'should not support character references as construct markers (1)'
  )

  // // To do: lists.
  // t.equal(
  //   m('&#42; foo\n\n* foo'),
  //   '<p>* foo</p>\n<ul>\n<li>foo</li>\n</ul>',
  //   'should not support character references as construct markers (2)'
  // )

  t.equal(
    m('[a](url &quot;tit&quot;)'),
    '<p>[a](url &quot;tit&quot;)</p>',
    'should not support character references as construct markers (3)'
  )

  t.equal(
    m('foo&#10;&#10;bar'),
    '<p>foo\n\nbar</p>',
    'should not support character references as whitespace (1)'
  )

  t.equal(
    m('&#9;foo'),
    '<p>\tfoo</p>',
    'should not support character references as whitespace (2)'
  )

  // Extra:
  t.equal(
    m('&CounterClockwiseContourIntegral;'),
    '<p>∳</p>',
    'should support the longest possible named character reference'
  )

  t.equal(
    m('&#xff9999;'),
    '<p>香</p>',
    'should support a longest possible hexadecimal character reference'
  )

  t.equal(
    m('&#9999999;'),
    '<p>陿</p>',
    'should support a longest possible decimal character reference'
  )

  t.equal(
    m('&CounterClockwiseContourIntegrali;'),
    '<p>&amp;CounterClockwiseContourIntegrali;</p>',
    'should not support the longest possible named character reference'
  )

  t.equal(
    m('&#xff99999;'),
    '<p>&amp;#xff99999;</p>',
    'should not support a longest possible hexadecimal character reference'
  )

  t.equal(
    m('&#99999999;'),
    '<p>&amp;#99999999;</p>',
    'should not support a longest possible decimal character reference'
  )

  t.equal(
    m('&-;'),
    '<p>&amp;-;</p>',
    'should not support the other characters after `&`'
  )

  t.equal(
    m('&#-;'),
    '<p>&amp;#-;</p>',
    'should not support the other characters after `#`'
  )

  t.equal(
    m('&#x-;'),
    '<p>&amp;#x-;</p>',
    'should not support the other characters after `#x`'
  )

  t.equal(
    m('&lt-;'),
    '<p>&amp;lt-;</p>',
    'should not support the other characters inside a name'
  )

  t.equal(
    m('&#9-;'),
    '<p>&amp;#9-;</p>',
    'should not support the other characters inside a demical'
  )

  t.equal(
    m('&#x9-;'),
    '<p>&amp;#x9-;</p>',
    'should not support the other characters inside a hexademical'
  )

  t.end()
})
