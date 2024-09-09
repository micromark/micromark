import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

const unsafe = {allowDangerousHtml: true}

test('html', async function (t) {
  await t.test('should support opening tags', async function () {
    assert.equal(micromark('<a><bab><c2c>', unsafe), '<p><a><bab><c2c></p>')
  })

  await t.test('should support self-closing tags', async function () {
    assert.equal(micromark('<a/><b2/>', unsafe), '<p><a/><b2/></p>')
  })

  await t.test('should support whitespace in tags', async function () {
    assert.equal(
      micromark('<a  /><b2\ndata="foo" >', unsafe),
      '<p><a  /><b2\ndata="foo" ></p>'
    )
  })

  await t.test('should support attributes on tags', async function () {
    assert.equal(
      micromark(
        '<a foo="bar" bam = \'baz <em>"</em>\'\n_boolean zoop:33=zoop:33 />',
        unsafe
      ),
      '<p><a foo="bar" bam = \'baz <em>"</em>\'\n_boolean zoop:33=zoop:33 /></p>'
    )
  })

  await t.test('should support non-html tags', async function () {
    assert.equal(
      micromark('Foo <responsive-image src="foo.jpg" />', unsafe),
      '<p>Foo <responsive-image src="foo.jpg" /></p>'
    )
  })

  await t.test('should not support nonconforming tag names', async function () {
    assert.equal(micromark('<33> <__>', unsafe), '<p>&lt;33&gt; &lt;__&gt;</p>')
  })

  await t.test(
    'should not support nonconforming attribute names',
    async function () {
      assert.equal(
        micromark('<a h*#ref="hi">', unsafe),
        '<p>&lt;a h*#ref=&quot;hi&quot;&gt;</p>'
      )
    }
  )

  await t.test(
    'should not support nonconforming attribute values',
    async function () {
      assert.equal(
        micromark("<a href=\"hi'> <a href=hi'>", unsafe),
        "<p>&lt;a href=&quot;hi'&gt; &lt;a href=hi'&gt;</p>"
      )
    }
  )

  await t.test(
    'should not support nonconforming whitespace',
    async function () {
      assert.equal(
        micromark('< a><\nfoo><bar/ >\n<foo bar=baz\nbim!bop />', unsafe),
        '<p>&lt; a&gt;&lt;\nfoo&gt;&lt;bar/ &gt;\n&lt;foo bar=baz\nbim!bop /&gt;</p>'
      )
    }
  )

  await t.test('should not support missing whitespace', async function () {
    assert.equal(
      micromark("<a href='bar'title=title>", unsafe),
      "<p>&lt;a href='bar'title=title&gt;</p>"
    )
  })

  await t.test('should support closing tags', async function () {
    assert.equal(micromark('</a></foo >', unsafe), '<p></a></foo ></p>')
  })

  await t.test(
    'should not support closing tags w/ attributes',
    async function () {
      assert.equal(
        micromark('</a href="foo">', unsafe),
        '<p>&lt;/a href=&quot;foo&quot;&gt;</p>'
      )
    }
  )

  await t.test('should support comments', async function () {
    assert.equal(
      micromark('foo <!-- this is a\ncomment - with hyphen -->', unsafe),
      '<p>foo <!-- this is a\ncomment - with hyphen --></p>'
    )
  })

  await t.test(
    'should support comments w/ two dashes inside',
    async function () {
      assert.equal(
        micromark('foo <!-- not a comment -- two hyphens -->', unsafe),
        '<p>foo <!-- not a comment -- two hyphens --></p>'
      )
    }
  )

  await t.test('should support nonconforming comments (1)', async function () {
    assert.equal(
      micromark('foo <!--> foo -->', unsafe),
      '<p>foo <!--> foo --&gt;</p>'
    )
  })

  await t.test('should support nonconforming comments (2)', async function () {
    assert.equal(
      micromark('foo <!-- foo--->', unsafe),
      '<p>foo <!-- foo---></p>'
    )
  })

  await t.test('should support instructions', async function () {
    assert.equal(
      micromark('foo <?php echo $a; ?>', unsafe),
      '<p>foo <?php echo $a; ?></p>'
    )
  })

  await t.test('should support declarations', async function () {
    assert.equal(
      micromark('foo <!ELEMENT br EMPTY>', unsafe),
      '<p>foo <!ELEMENT br EMPTY></p>'
    )
  })

  await t.test('should support cdata', async function () {
    assert.equal(
      micromark('foo <![CDATA[>&<]]>', unsafe),
      '<p>foo <![CDATA[>&<]]></p>'
    )
  })

  await t.test(
    'should support (ignore) character references',
    async function () {
      assert.equal(
        micromark('foo <a href="&ouml;">', unsafe),
        '<p>foo <a href="&ouml;"></p>'
      )
    }
  )

  await t.test('should not support character escapes (1)', async function () {
    assert.equal(
      micromark('foo <a href="\\*">', unsafe),
      '<p>foo <a href="\\*"></p>'
    )
  })

  await t.test('should not support character escapes (2)', async function () {
    assert.equal(
      micromark('<a href="\\"">', unsafe),
      '<p>&lt;a href=&quot;&quot;&quot;&gt;</p>'
    )
  })

  await t.test(
    'should not support non-comment, non-cdata, and non-named declaration',
    async function () {
      // Extra:
      assert.equal(micromark('foo <!1>', unsafe), '<p>foo &lt;!1&gt;</p>')
    }
  )

  await t.test(
    'should not support comments w/ not enough dashes',
    async function () {
      assert.equal(
        micromark('foo <!-not enough!-->', unsafe),
        '<p>foo &lt;!-not enough!--&gt;</p>'
      )
    }
  )

  await t.test(
    'should support comments that start w/ a dash, if it’s not followed by a greater than',
    async function () {
      assert.equal(micromark('foo <!---ok-->', unsafe), '<p>foo <!---ok--></p>')
    }
  )

  await t.test('should support comments that start w/ `->`', async function () {
    assert.equal(micromark('foo <!--->', unsafe), '<p>foo <!---></p>')
  })

  await t.test('should support `->` in a comment', async function () {
    assert.equal(micromark('foo <!-- -> -->', unsafe), '<p>foo <!-- -> --></p>')
  })

  await t.test('should not support eof in a comment (1)', async function () {
    assert.equal(micromark('foo <!--', unsafe), '<p>foo &lt;!--</p>')
  })

  await t.test('should not support eof in a comment (2)', async function () {
    assert.equal(micromark('foo <!--a', unsafe), '<p>foo &lt;!--a</p>')
  })

  await t.test('should not support eof in a comment (3)', async function () {
    assert.equal(micromark('foo <!--a-', unsafe), '<p>foo &lt;!--a-</p>')
  })

  await t.test('should not support eof in a comment (4)', async function () {
    assert.equal(micromark('foo <!--a--', unsafe), '<p>foo &lt;!--a--</p>')
  })

  await t.test('should not support lowercase “cdata”', async function () {
    // Note: cmjs parses this differently.
    // See: <https://github.com/commonmark/commonmark.js/issues/193>
    assert.equal(
      micromark('foo <![cdata[]]>', unsafe),
      '<p>foo &lt;![cdata[]]&gt;</p>'
    )
  })

  await t.test('should not support eof in a CDATA (1)', async function () {
    assert.equal(micromark('foo <![CDATA', unsafe), '<p>foo &lt;![CDATA</p>')
  })

  await t.test('should not support eof in a CDATA (2)', async function () {
    assert.equal(micromark('foo <![CDATA[', unsafe), '<p>foo &lt;![CDATA[</p>')
  })

  await t.test('should not support eof in a CDATA (3)', async function () {
    assert.equal(
      micromark('foo <![CDATA[]', unsafe),
      '<p>foo &lt;![CDATA[]</p>'
    )
  })

  await t.test('should not support eof in a CDATA (4)', async function () {
    assert.equal(
      micromark('foo <![CDATA[]]', unsafe),
      '<p>foo &lt;![CDATA[]]</p>'
    )
  })

  await t.test('should not support eof in a CDATA (5)', async function () {
    assert.equal(
      micromark('foo <![CDATA[asd', unsafe),
      '<p>foo &lt;![CDATA[asd</p>'
    )
  })

  await t.test(
    'should support end-like constructs in CDATA',
    async function () {
      assert.equal(
        micromark('foo <![CDATA[]]]]>', unsafe),
        '<p>foo <![CDATA[]]]]></p>'
      )
    }
  )

  await t.test('should not support eof in declarations', async function () {
    assert.equal(micromark('foo <!doctype', unsafe), '<p>foo &lt;!doctype</p>')
  })

  await t.test('should not support eof in instructions (1)', async function () {
    assert.equal(micromark('foo <?php', unsafe), '<p>foo &lt;?php</p>')
  })

  await t.test('should not support eof in instructions (2)', async function () {
    assert.equal(micromark('foo <?php?', unsafe), '<p>foo &lt;?php?</p>')
  })

  await t.test(
    'should support question marks in instructions',
    async function () {
      assert.equal(micromark('foo <???>', unsafe), '<p>foo <???></p>')
    }
  )

  await t.test(
    'should not support closing tags that don’t start w/ alphas',
    async function () {
      assert.equal(micromark('foo </3>', unsafe), '<p>foo &lt;/3&gt;</p>')
    }
  )

  await t.test('should support dashes in closing tags', async function () {
    assert.equal(micromark('foo </a->', unsafe), '<p>foo </a-></p>')
  })

  await t.test(
    'should support whitespace after closing tag names',
    async function () {
      assert.equal(micromark('foo </a   >', unsafe), '<p>foo </a   ></p>')
    }
  )

  await t.test(
    'should not support other characters after closing tag names',
    async function () {
      assert.equal(micromark('foo </a!>', unsafe), '<p>foo &lt;/a!&gt;</p>')
    }
  )

  await t.test('should support dashes in opening tags', async function () {
    assert.equal(micromark('foo <a->', unsafe), '<p>foo <a-></p>')
  })

  await t.test(
    'should support whitespace after opening tag names',
    async function () {
      assert.equal(micromark('foo <a   >', unsafe), '<p>foo <a   ></p>')
    }
  )

  await t.test(
    'should not support other characters after opening tag names',
    async function () {
      assert.equal(micromark('foo <a!>', unsafe), '<p>foo &lt;a!&gt;</p>')
    }
  )

  await t.test(
    'should not support other characters in opening tags (1)',
    async function () {
      assert.equal(micromark('foo <a !>', unsafe), '<p>foo &lt;a !&gt;</p>')
    }
  )

  await t.test(
    'should not support other characters in opening tags (2)',
    async function () {
      assert.equal(micromark('foo <a b!>', unsafe), '<p>foo &lt;a b!&gt;</p>')
    }
  )

  await t.test(
    'should support a self-closing slash after an attribute name',
    async function () {
      assert.equal(micromark('foo <a b/>', unsafe), '<p>foo <a b/></p>')
    }
  )

  await t.test(
    'should support a greater than after an attribute name',
    async function () {
      assert.equal(micromark('foo <a b>', unsafe), '<p>foo <a b></p>')
    }
  )

  await t.test(
    'should not support less than to start an unquoted attribute value',
    async function () {
      assert.equal(
        micromark('foo <a b=<>', unsafe),
        '<p>foo &lt;a b=&lt;&gt;</p>'
      )
    }
  )

  await t.test(
    'should not support greater than to start an unquoted attribute value',
    async function () {
      assert.equal(
        micromark('foo <a b=>>', unsafe),
        '<p>foo &lt;a b=&gt;&gt;</p>'
      )
    }
  )

  await t.test(
    'should not support equals to to start an unquoted attribute value',
    async function () {
      assert.equal(micromark('foo <a b==>', unsafe), '<p>foo &lt;a b==&gt;</p>')
    }
  )

  await t.test(
    'should not support grave accent to start an unquoted attribute value',
    async function () {
      assert.equal(micromark('foo <a b=`>'), '<p>foo &lt;a b=`&gt;</p>')
    }
  )

  await t.test(
    'should not support eof in double quoted attribute value',
    async function () {
      assert.equal(
        micromark('foo <a b="asd', unsafe),
        '<p>foo &lt;a b=&quot;asd</p>'
      )
    }
  )

  await t.test(
    'should not support eof in single quoted attribute value',
    async function () {
      assert.equal(
        micromark("foo <a b='asd", unsafe),
        "<p>foo &lt;a b='asd</p>"
      )
    }
  )

  await t.test(
    'should not support eof in unquoted attribute value',
    async function () {
      assert.equal(micromark('foo <a b=asd', unsafe), '<p>foo &lt;a b=asd</p>')
    }
  )

  await t.test(
    'should support an eol before an attribute value',
    async function () {
      assert.equal(
        micromark('foo <a b=\nasd>', unsafe),
        '<p>foo <a b=\nasd></p>'
      )
    }
  )

  await t.test(
    'should support starting a line w/ a tag if followed by anything other than an eol (after optional space/tabs)',
    async function () {
      assert.equal(micromark('<x> a', unsafe), '<p><x> a</p>')
    }
  )

  await t.test(
    'should support an EOF before an attribute value',
    async function () {
      assert.equal(micromark('<span foo=', unsafe), '<p>&lt;span foo=</p>')
    }
  )

  await t.test('should support an EOL in a declaration', async function () {
    assert.equal(micromark('a <!b\nc>', unsafe), '<p>a <!b\nc></p>')
  })

  await t.test('should support an EOL in cdata', async function () {
    assert.equal(
      micromark('a <![CDATA[\n]]>', unsafe),
      '<p>a <![CDATA[\n]]></p>'
    )
  })

  await t.test('should support an EOL in an instruction', async function () {
    // Note: cmjs parses this differently.
    // See: <https://github.com/commonmark/commonmark.js/issues/196>
    assert.equal(micromark('a <?\n?>', unsafe), '<p>a <?\n?></p>')
  })

  await t.test('should support turning off html (text)', async function () {
    assert.equal(
      micromark('a <x>', {extensions: [{disable: {null: ['htmlText']}}]}),
      '<p>a &lt;x&gt;</p>'
    )
  })
})
