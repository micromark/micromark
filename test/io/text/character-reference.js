import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('character-reference', async function (t) {
  await t.test('should support named character references', async function () {
    assert.equal(
      micromark(
        [
          '&nbsp; &amp; &copy; &AElig; &Dcaron;',
          '&frac34; &HilbertSpace; &DifferentialD;',
          '&ClockwiseContourIntegral; &ngE;'
        ].join('\n')
      ),
      '<p>  &amp; © Æ Ď\n¾ ℋ ⅆ\n∲ ≧̸</p>'
    )
  })

  await t.test(
    'should support decimal character references',
    async function () {
      assert.equal(micromark('&#35; &#1234; &#992; &#0;'), '<p># Ӓ Ϡ �</p>')
    }
  )

  await t.test(
    'should support hexadecimal character references',
    async function () {
      assert.equal(micromark('&#X22; &#XD06; &#xcab;'), '<p>&quot; ആ ಫ</p>')
    }
  )

  await t.test('should support astral character references', async function () {
    assert.equal(micromark('片&#xE0103;'), '<p>片\u{E0103}</p>')
  })

  await t.test(
    'should not support other things that look like character references',
    async function () {
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
        ].join('\n')
      )
    }
  )

  await t.test(
    'should not support character references w/o semicolon',
    async function () {
      assert.equal(micromark('&copy'), '<p>&amp;copy</p>')
    }
  )

  await t.test(
    'should not support unknown named character references',
    async function () {
      assert.equal(micromark('&MadeUpEntity;'), '<p>&amp;MadeUpEntity;</p>')
    }
  )

  await t.test(
    'should not care about character references in html',
    async function () {
      assert.equal(
        micromark('<a href="&ouml;&ouml;.html">', {allowDangerousHtml: true}),
        '<a href="&ouml;&ouml;.html">'
      )
    }
  )

  await t.test(
    'should support character references in resource URLs and titles',
    async function () {
      assert.equal(
        micromark('[foo](/f&ouml;&ouml; "f&ouml;&ouml;")'),
        '<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>'
      )
    }
  )

  await t.test(
    'should support character references in definition URLs and titles',
    async function () {
      assert.equal(
        micromark('[foo]: /f&ouml;&ouml; "f&ouml;&ouml;"\n\n[foo]'),
        '<p><a href="/f%C3%B6%C3%B6" title="föö">foo</a></p>'
      )
    }
  )

  await t.test(
    'should support character references in code language',
    async function () {
      assert.equal(
        micromark('``` f&ouml;&ouml;\nfoo\n```'),
        '<pre><code class="language-föö">foo\n</code></pre>'
      )
    }
  )

  await t.test(
    'should not support character references in text code',
    async function () {
      assert.equal(
        micromark('`f&ouml;&ouml;`'),
        '<p><code>f&amp;ouml;&amp;ouml;</code></p>'
      )
    }
  )

  await t.test(
    'should not support character references in indented code',
    async function () {
      assert.equal(
        micromark('    f&ouml;f&ouml;'),
        '<pre><code>f&amp;ouml;f&amp;ouml;\n</code></pre>'
      )
    }
  )

  await t.test(
    'should not support character references as construct markers (1)',
    async function () {
      assert.equal(
        micromark('&#42;foo&#42;\n*foo*'),
        '<p>*foo*\n<em>foo</em></p>'
      )
    }
  )

  await t.test(
    'should not support character references as construct markers (2)',
    async function () {
      assert.equal(
        micromark('&#42; foo\n\n* foo'),
        '<p>* foo</p>\n<ul>\n<li>foo</li>\n</ul>'
      )
    }
  )

  await t.test(
    'should not support character references as construct markers (3)',
    async function () {
      assert.equal(
        micromark('[a](url &quot;tit&quot;)'),
        '<p>[a](url &quot;tit&quot;)</p>'
      )
    }
  )

  await t.test(
    'should not support character references as whitespace (1)',
    async function () {
      assert.equal(micromark('foo&#10;&#10;bar'), '<p>foo\n\nbar</p>')
    }
  )

  await t.test(
    'should not support character references as whitespace (2)',
    async function () {
      assert.equal(micromark('&#9;foo'), '<p>\tfoo</p>')
    }
  )

  await t.test(
    'should support the longest possible named character reference',
    async function () {
      // Extra:
      assert.equal(micromark('&CounterClockwiseContourIntegral;'), '<p>∳</p>')
    }
  )

  await t.test(
    'should “support” a longest possible hexadecimal character reference',
    async function () {
      assert.equal(micromark('&#xff9999;'), '<p>�</p>')
    }
  )

  await t.test(
    'should “support” a longest possible decimal character reference',
    async function () {
      assert.equal(micromark('&#9999999;'), '<p>�</p>')
    }
  )

  await t.test(
    'should not support the longest possible named character reference',
    async function () {
      assert.equal(
        micromark('&CounterClockwiseContourIntegrali;'),
        '<p>&amp;CounterClockwiseContourIntegrali;</p>'
      )
    }
  )

  await t.test(
    'should not support a longest possible hexadecimal character reference',
    async function () {
      assert.equal(micromark('&#xff99999;'), '<p>&amp;#xff99999;</p>')
    }
  )

  await t.test(
    'should not support a longest possible decimal character reference',
    async function () {
      assert.equal(micromark('&#99999999;'), '<p>&amp;#99999999;</p>')
    }
  )

  await t.test(
    'should not support the other characters after `&`',
    async function () {
      assert.equal(micromark('&-;'), '<p>&amp;-;</p>')
    }
  )

  await t.test(
    'should not support the other characters after `#`',
    async function () {
      assert.equal(micromark('&#-;'), '<p>&amp;#-;</p>')
    }
  )

  await t.test(
    'should not support the other characters after `#x`',
    async function () {
      assert.equal(micromark('&#x-;'), '<p>&amp;#x-;</p>')
    }
  )

  await t.test(
    'should not support the other characters inside a name',
    async function () {
      assert.equal(micromark('&lt-;'), '<p>&amp;lt-;</p>')
    }
  )

  await t.test(
    'should not support the other characters inside a demical',
    async function () {
      assert.equal(micromark('&#9-;'), '<p>&amp;#9-;</p>')
    }
  )

  await t.test(
    'should not support the other characters inside a hexademical',
    async function () {
      assert.equal(micromark('&#x9-;'), '<p>&amp;#x9-;</p>')
    }
  )

  await t.test(
    'should support turning off character references',
    async function () {
      assert.equal(
        micromark('&amp;', {
          extensions: [{disable: {null: ['characterReferences']}}]
        }),
        '<p>&amp;</p>'
      )
    }
  )
})
