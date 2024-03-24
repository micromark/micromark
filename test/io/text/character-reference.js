import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('character-reference', function () {
  assert.equal(
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

  assert.equal(
    micromark('&#35; &#1234; &#992; &#0;'),
    '<p># Ӓ Ϡ \uFFFD</p>',
    'should support decimal character references'
  )

  assert.equal(
    micromark('&#X22; &#XD06; &#xcab;'),
    '<p>&quot; ആ ಫ</p>',
    'should support hexadecimal character references'
  )

  assert.equal(
    micromark('片&#xE0103;'),
    '<p>片\u{E0103}</p>',
    'should support astral character references'
  )

  assert.equal(
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

  assert.equal(
    micromark('&copy'),
    '<p>&amp;copy</p>',
    'should not support character references w/o semicolon'
  )

  assert.equal(
    micromark('&MadeUpEntity;'),
    '<p>&amp;MadeUpEntity;</p>',
    'should not support unknown named character references'
  )

  assert.equal(
    micromark('<a href="&ouml;&ouml;.html">', {allowDangerousHtml: true}),
    '<a href="&ouml;&ouml;.html">',
    'should not care about character references in html'
  )

  assert.equal(
    micromark('[foo](/f&ouml;&ouml; "f&ouml;&ouml;")'),
    '<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>',
    'should support character references in resource URLs and titles'
  )

  assert.equal(
    micromark('[foo]: /f&ouml;&ouml; "f&ouml;&ouml;"\n\n[foo]'),
    '<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>',
    'should support character references in definition URLs and titles'
  )

  assert.equal(
    micromark('``` f&ouml;&ouml;\nfoo\n```'),
    '<pre><code class="language-föö">foo\n</code></pre>',
    'should support character references in code language'
  )

  assert.equal(
    micromark('`f&ouml;&ouml;`'),
    '<p><code>f&amp;ouml;&amp;ouml;</code></p>',
    'should not support character references in text code'
  )

  assert.equal(
    micromark('    f&ouml;f&ouml;'),
    '<pre><code>f&amp;ouml;f&amp;ouml;\n</code></pre>',
    'should not support character references in indented code'
  )

  assert.equal(
    micromark('&#42;foo&#42;\n*foo*'),
    '<p>*foo*\n<em>foo</em></p>',
    'should not support character references as construct markers (1)'
  )

  assert.equal(
    micromark('&#42; foo\n\n* foo'),
    '<p>* foo</p>\n<ul>\n<li>foo</li>\n</ul>',
    'should not support character references as construct markers (2)'
  )

  assert.equal(
    micromark('[a](url &quot;tit&quot;)'),
    '<p>[a](url &quot;tit&quot;)</p>',
    'should not support character references as construct markers (3)'
  )

  assert.equal(
    micromark('foo&#10;&#10;bar'),
    '<p>foo\n\nbar</p>',
    'should not support character references as whitespace (1)'
  )

  assert.equal(
    micromark('&#9;foo'),
    '<p>\tfoo</p>',
    'should not support character references as whitespace (2)'
  )

  // Extra:
  assert.equal(
    micromark('&CounterClockwiseContourIntegral;'),
    '<p>∳</p>',
    'should support the longest possible named character reference'
  )

  assert.equal(
    micromark('&#xff9999;'),
    '<p>\uFFFD</p>',
    'should “support” a longest possible hexadecimal character reference'
  )

  assert.equal(
    micromark('&#9999999;'),
    '<p>\uFFFD</p>',
    'should “support” a longest possible decimal character reference'
  )

  assert.equal(
    micromark('&CounterClockwiseContourIntegrali;'),
    '<p>&amp;CounterClockwiseContourIntegrali;</p>',
    'should not support the longest possible named character reference'
  )

  assert.equal(
    micromark('&#xff99999;'),
    '<p>&amp;#xff99999;</p>',
    'should not support a longest possible hexadecimal character reference'
  )

  assert.equal(
    micromark('&#99999999;'),
    '<p>&amp;#99999999;</p>',
    'should not support a longest possible decimal character reference'
  )

  assert.equal(
    micromark('&-;'),
    '<p>&amp;-;</p>',
    'should not support the other characters after `&`'
  )

  assert.equal(
    micromark('&#-;'),
    '<p>&amp;#-;</p>',
    'should not support the other characters after `#`'
  )

  assert.equal(
    micromark('&#x-;'),
    '<p>&amp;#x-;</p>',
    'should not support the other characters after `#x`'
  )

  assert.equal(
    micromark('&lt-;'),
    '<p>&amp;lt-;</p>',
    'should not support the other characters inside a name'
  )

  assert.equal(
    micromark('&#9-;'),
    '<p>&amp;#9-;</p>',
    'should not support the other characters inside a demical'
  )

  assert.equal(
    micromark('&#x9-;'),
    '<p>&amp;#x9-;</p>',
    'should not support the other characters inside a hexademical'
  )

  assert.equal(
    micromark('&amp;', {
      extensions: [{disable: {null: ['characterReferences']}}]
    }),
    '<p>&amp;</p>',
    'should support turning off character references'
  )
})
