import test from 'tape'
import {micromark} from 'micromark'

test('character-reference', function (t) {
  t.equal(
    micromark(
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
    micromark('&#35; &#1234; &#992; &#0;'),
    '<p># Ӓ Ϡ �</p>',
    'should support decimal character references'
  )

  t.equal(
    micromark('&#X22; &#XD06; &#xcab;'),
    '<p>&quot; ആ ಫ</p>',
    'should support hexadecimal character references'
  )

  t.equal(
    micromark(
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
    micromark('&copy'),
    '<p>&amp;copy</p>',
    'should not support character references w/o semicolon'
  )

  t.equal(
    micromark('&MadeUpEntity;'),
    '<p>&amp;MadeUpEntity;</p>',
    'should not support unknown named character references'
  )

  t.equal(
    micromark('<a href="&ouml;&ouml;.html">', {allowDangerousHtml: true}),
    '<a href="&ouml;&ouml;.html">',
    'should not care about character references in html'
  )

  t.equal(
    micromark('[foo](/f&ouml;&ouml; "f&ouml;&ouml;")'),
    '<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>',
    'should support character references in resource URLs and titles'
  )

  t.equal(
    micromark('[foo]: /f&ouml;&ouml; "f&ouml;&ouml;"\n\n[foo]'),
    '<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>',
    'should support character references in definition URLs and titles'
  )

  t.equal(
    micromark('``` f&ouml;&ouml;\nfoo\n```'),
    '<pre><code class="language-föö">foo\n</code></pre>',
    'should support character references in code language'
  )

  t.equal(
    micromark('`f&ouml;&ouml;`'),
    '<p><code>f&amp;ouml;&amp;ouml;</code></p>',
    'should not support character references in text code'
  )

  t.equal(
    micromark('    f&ouml;f&ouml;'),
    '<pre><code>f&amp;ouml;f&amp;ouml;\n</code></pre>',
    'should not support character references in indented code'
  )

  t.equal(
    micromark('&#42;foo&#42;\n*foo*'),
    '<p>*foo*\n<em>foo</em></p>',
    'should not support character references as construct markers (1)'
  )

  t.equal(
    micromark('&#42; foo\n\n* foo'),
    '<p>* foo</p>\n<ul>\n<li>foo</li>\n</ul>',
    'should not support character references as construct markers (2)'
  )

  t.equal(
    micromark('[a](url &quot;tit&quot;)'),
    '<p>[a](url &quot;tit&quot;)</p>',
    'should not support character references as construct markers (3)'
  )

  t.equal(
    micromark('foo&#10;&#10;bar'),
    '<p>foo\n\nbar</p>',
    'should not support character references as whitespace (1)'
  )

  t.equal(
    micromark('&#9;foo'),
    '<p>\tfoo</p>',
    'should not support character references as whitespace (2)'
  )

  // Extra:
  t.equal(
    micromark('&CounterClockwiseContourIntegral;'),
    '<p>∳</p>',
    'should support the longest possible named character reference'
  )

  t.equal(
    micromark('&#xff9999;'),
    '<p>�</p>',
    'should “support” a longest possible hexadecimal character reference'
  )

  t.equal(
    micromark('&#9999999;'),
    '<p>�</p>',
    'should “support” a longest possible decimal character reference'
  )

  t.equal(
    micromark('&CounterClockwiseContourIntegrali;'),
    '<p>&amp;CounterClockwiseContourIntegrali;</p>',
    'should not support the longest possible named character reference'
  )

  t.equal(
    micromark('&#xff99999;'),
    '<p>&amp;#xff99999;</p>',
    'should not support a longest possible hexadecimal character reference'
  )

  t.equal(
    micromark('&#99999999;'),
    '<p>&amp;#99999999;</p>',
    'should not support a longest possible decimal character reference'
  )

  t.equal(
    micromark('&-;'),
    '<p>&amp;-;</p>',
    'should not support the other characters after `&`'
  )

  t.equal(
    micromark('&#-;'),
    '<p>&amp;#-;</p>',
    'should not support the other characters after `#`'
  )

  t.equal(
    micromark('&#x-;'),
    '<p>&amp;#x-;</p>',
    'should not support the other characters after `#x`'
  )

  t.equal(
    micromark('&lt-;'),
    '<p>&amp;lt-;</p>',
    'should not support the other characters inside a name'
  )

  t.equal(
    micromark('&#9-;'),
    '<p>&amp;#9-;</p>',
    'should not support the other characters inside a demical'
  )

  t.equal(
    micromark('&#x9-;'),
    '<p>&amp;#x9-;</p>',
    'should not support the other characters inside a hexademical'
  )

  t.equal(
    micromark('&amp;', {
      extensions: [{disable: {null: ['characterReferences']}}]
    }),
    '<p>&amp;</p>',
    'should support turning off character references'
  )

  t.end()
})
