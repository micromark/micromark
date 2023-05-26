import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

const unsafe = {allowDangerousHtml: true}

test('html', function () {
  assert.equal(
    micromark('<a><bab><c2c>', unsafe),
    '<p><a><bab><c2c></p>',
    'should support opening tags'
  )

  assert.equal(
    micromark('<a/><b2/>', unsafe),
    '<p><a/><b2/></p>',
    'should support self-closing tags'
  )

  assert.equal(
    micromark('<a  /><b2\ndata="foo" >', unsafe),
    '<p><a  /><b2\ndata="foo" ></p>',
    'should support whitespace in tags'
  )

  assert.equal(
    micromark(
      '<a foo="bar" bam = \'baz <em>"</em>\'\n_boolean zoop:33=zoop:33 />',
      unsafe
    ),
    '<p><a foo="bar" bam = \'baz <em>"</em>\'\n_boolean zoop:33=zoop:33 /></p>',
    'should support attributes on tags'
  )

  assert.equal(
    micromark('Foo <responsive-image src="foo.jpg" />', unsafe),
    '<p>Foo <responsive-image src="foo.jpg" /></p>',
    'should support non-html tags'
  )

  assert.equal(
    micromark('<33> <__>', unsafe),
    '<p>&lt;33&gt; &lt;__&gt;</p>',
    'should not support nonconforming tag names'
  )

  assert.equal(
    micromark('<a h*#ref="hi">', unsafe),
    '<p>&lt;a h*#ref=&quot;hi&quot;&gt;</p>',
    'should not support nonconforming attribute names'
  )

  assert.equal(
    micromark("<a href=\"hi'> <a href=hi'>", unsafe),
    "<p>&lt;a href=&quot;hi'&gt; &lt;a href=hi'&gt;</p>",
    'should not support nonconforming attribute values'
  )

  assert.equal(
    micromark('< a><\nfoo><bar/ >\n<foo bar=baz\nbim!bop />', unsafe),
    '<p>&lt; a&gt;&lt;\nfoo&gt;&lt;bar/ &gt;\n&lt;foo bar=baz\nbim!bop /&gt;</p>',
    'should not support nonconforming whitespace'
  )

  assert.equal(
    micromark("<a href='bar'title=title>", unsafe),
    "<p>&lt;a href='bar'title=title&gt;</p>",
    'should not support missing whitespace'
  )

  assert.equal(
    micromark('</a></foo >', unsafe),
    '<p></a></foo ></p>',
    'should support closing tags'
  )

  assert.equal(
    micromark('</a href="foo">', unsafe),
    '<p>&lt;/a href=&quot;foo&quot;&gt;</p>',
    'should not support closing tags w/ attributes'
  )

  assert.equal(
    micromark('foo <!-- this is a\ncomment - with hyphen -->', unsafe),
    '<p>foo <!-- this is a\ncomment - with hyphen --></p>',
    'should support comments'
  )

  assert.equal(
    micromark('foo <!-- not a comment -- two hyphens -->', unsafe),
    '<p>foo <!-- not a comment -- two hyphens --></p>',
    'should support comments w/ two dashes inside'
  )

  assert.equal(
    micromark('foo <!--> foo -->', unsafe),
    '<p>foo <!--> foo --&gt;</p>',
    'should support nonconforming comments (1)'
  )

  assert.equal(
    micromark('foo <!-- foo--->', unsafe),
    '<p>foo <!-- foo---></p>',
    'should support nonconforming comments (2)'
  )

  assert.equal(
    micromark('foo <?php echo $a; ?>', unsafe),
    '<p>foo <?php echo $a; ?></p>',
    'should support instructions'
  )

  assert.equal(
    micromark('foo <!ELEMENT br EMPTY>', unsafe),
    '<p>foo <!ELEMENT br EMPTY></p>',
    'should support declarations'
  )

  assert.equal(
    micromark('foo <![CDATA[>&<]]>', unsafe),
    '<p>foo <![CDATA[>&<]]></p>',
    'should support cdata'
  )

  assert.equal(
    micromark('foo <a href="&ouml;">', unsafe),
    '<p>foo <a href="&ouml;"></p>',
    'should support (ignore) character references'
  )

  assert.equal(
    micromark('foo <a href="\\*">', unsafe),
    '<p>foo <a href="\\*"></p>',
    'should not support character escapes (1)'
  )

  assert.equal(
    micromark('<a href="\\"">', unsafe),
    '<p>&lt;a href=&quot;&quot;&quot;&gt;</p>',
    'should not support character escapes (2)'
  )

  // Extra:
  assert.equal(
    micromark('foo <!1>', unsafe),
    '<p>foo &lt;!1&gt;</p>',
    'should not support non-comment, non-cdata, and non-named declaration'
  )

  assert.equal(
    micromark('foo <!-not enough!-->', unsafe),
    '<p>foo &lt;!-not enough!--&gt;</p>',
    'should not support comments w/ not enough dashes'
  )

  assert.equal(
    micromark('foo <!---ok-->', unsafe),
    '<p>foo <!---ok--></p>',
    'should support comments that start w/ a dash, if it’s not followed by a greater than'
  )

  assert.equal(
    micromark('foo <!--->', unsafe),
    '<p>foo <!---></p>',
    'should support comments that start w/ `->`'
  )

  assert.equal(
    micromark('foo <!-- -> -->', unsafe),
    '<p>foo <!-- -> --></p>',
    'should support `->` in a comment'
  )

  assert.equal(
    micromark('foo <!--', unsafe),
    '<p>foo &lt;!--</p>',
    'should not support eof in a comment (1)'
  )

  assert.equal(
    micromark('foo <!--a', unsafe),
    '<p>foo &lt;!--a</p>',
    'should not support eof in a comment (2)'
  )

  assert.equal(
    micromark('foo <!--a-', unsafe),
    '<p>foo &lt;!--a-</p>',
    'should not support eof in a comment (3)'
  )

  assert.equal(
    micromark('foo <!--a--', unsafe),
    '<p>foo &lt;!--a--</p>',
    'should not support eof in a comment (4)'
  )

  // Note: cmjs parses this differently.
  // See: <https://github.com/commonmark/commonmark.js/issues/193>
  assert.equal(
    micromark('foo <![cdata[]]>', unsafe),
    '<p>foo &lt;![cdata[]]&gt;</p>',
    'should not support lowercase “cdata”'
  )

  assert.equal(
    micromark('foo <![CDATA', unsafe),
    '<p>foo &lt;![CDATA</p>',
    'should not support eof in a CDATA (1)'
  )

  assert.equal(
    micromark('foo <![CDATA[', unsafe),
    '<p>foo &lt;![CDATA[</p>',
    'should not support eof in a CDATA (2)'
  )

  assert.equal(
    micromark('foo <![CDATA[]', unsafe),
    '<p>foo &lt;![CDATA[]</p>',
    'should not support eof in a CDATA (3)'
  )

  assert.equal(
    micromark('foo <![CDATA[]]', unsafe),
    '<p>foo &lt;![CDATA[]]</p>',
    'should not support eof in a CDATA (4)'
  )

  assert.equal(
    micromark('foo <![CDATA[asd', unsafe),
    '<p>foo &lt;![CDATA[asd</p>',
    'should not support eof in a CDATA (5)'
  )

  assert.equal(
    micromark('foo <![CDATA[]]]]>', unsafe),
    '<p>foo <![CDATA[]]]]></p>',
    'should support end-like constructs in CDATA'
  )

  assert.equal(
    micromark('foo <!doctype', unsafe),
    '<p>foo &lt;!doctype</p>',
    'should not support eof in declarations'
  )

  assert.equal(
    micromark('foo <?php', unsafe),
    '<p>foo &lt;?php</p>',
    'should not support eof in instructions (1)'
  )

  assert.equal(
    micromark('foo <?php?', unsafe),
    '<p>foo &lt;?php?</p>',
    'should not support eof in instructions (2)'
  )

  assert.equal(
    micromark('foo <???>', unsafe),
    '<p>foo <???></p>',
    'should support question marks in instructions'
  )

  assert.equal(
    micromark('foo </3>', unsafe),
    '<p>foo &lt;/3&gt;</p>',
    'should not support closing tags that don’t start w/ alphas'
  )

  assert.equal(
    micromark('foo </a->', unsafe),
    '<p>foo </a-></p>',
    'should support dashes in closing tags'
  )

  assert.equal(
    micromark('foo </a   >', unsafe),
    '<p>foo </a   ></p>',
    'should support whitespace after closing tag names'
  )

  assert.equal(
    micromark('foo </a!>', unsafe),
    '<p>foo &lt;/a!&gt;</p>',
    'should not support other characters after closing tag names'
  )

  assert.equal(
    micromark('foo <a->', unsafe),
    '<p>foo <a-></p>',
    'should support dashes in opening tags'
  )

  assert.equal(
    micromark('foo <a   >', unsafe),
    '<p>foo <a   ></p>',
    'should support whitespace after opening tag names'
  )

  assert.equal(
    micromark('foo <a!>', unsafe),
    '<p>foo &lt;a!&gt;</p>',
    'should not support other characters after opening tag names'
  )

  assert.equal(
    micromark('foo <a !>', unsafe),
    '<p>foo &lt;a !&gt;</p>',
    'should not support other characters in opening tags (1)'
  )

  assert.equal(
    micromark('foo <a b!>', unsafe),
    '<p>foo &lt;a b!&gt;</p>',
    'should not support other characters in opening tags (2)'
  )

  assert.equal(
    micromark('foo <a b/>', unsafe),
    '<p>foo <a b/></p>',
    'should support a self-closing slash after an attribute name'
  )

  assert.equal(
    micromark('foo <a b>', unsafe),
    '<p>foo <a b></p>',
    'should support a greater than after an attribute name'
  )

  assert.equal(
    micromark('foo <a b=<>', unsafe),
    '<p>foo &lt;a b=&lt;&gt;</p>',
    'should not support less than to start an unquoted attribute value'
  )

  assert.equal(
    micromark('foo <a b=>>', unsafe),
    '<p>foo &lt;a b=&gt;&gt;</p>',
    'should not support greater than to start an unquoted attribute value'
  )

  assert.equal(
    micromark('foo <a b==>', unsafe),
    '<p>foo &lt;a b==&gt;</p>',
    'should not support equals to to start an unquoted attribute value'
  )

  assert.equal(
    micromark('foo <a b=`>'),
    '<p>foo &lt;a b=`&gt;</p>',
    'should not support grave accent to start an unquoted attribute value'
  )

  assert.equal(
    micromark('foo <a b="asd', unsafe),
    '<p>foo &lt;a b=&quot;asd</p>',
    'should not support eof in double quoted attribute value'
  )

  assert.equal(
    micromark("foo <a b='asd", unsafe),
    "<p>foo &lt;a b='asd</p>",
    'should not support eof in single quoted attribute value'
  )

  assert.equal(
    micromark('foo <a b=asd', unsafe),
    '<p>foo &lt;a b=asd</p>',
    'should not support eof in unquoted attribute value'
  )

  assert.equal(
    micromark('foo <a b=\nasd>', unsafe),
    '<p>foo <a b=\nasd></p>',
    'should support an eol before an attribute value'
  )

  assert.equal(
    micromark('<x> a', unsafe),
    '<p><x> a</p>',
    'should support starting a line w/ a tag if followed by anything other than an eol (after optional space/tabs)'
  )

  assert.equal(
    micromark('<span foo=', unsafe),
    '<p>&lt;span foo=</p>',
    'should support an EOF before an attribute value'
  )

  assert.equal(
    micromark('a <!b\nc>', unsafe),
    '<p>a <!b\nc></p>',
    'should support an EOL in a declaration'
  )
  assert.equal(
    micromark('a <![CDATA[\n]]>', unsafe),
    '<p>a <![CDATA[\n]]></p>',
    'should support an EOL in cdata'
  )

  // Note: cmjs parses this differently.
  // See: <https://github.com/commonmark/commonmark.js/issues/196>
  assert.equal(
    micromark('a <?\n?>', unsafe),
    '<p>a <?\n?></p>',
    'should support an EOL in an instruction'
  )

  assert.equal(
    micromark('a <x>', {extensions: [{disable: {null: ['htmlText']}}]}),
    '<p>a &lt;x&gt;</p>',
    'should support turning off html (text)'
  )
})
