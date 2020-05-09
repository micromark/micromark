'use strict'

var test = require('tape')
var m = require('../../..')

test('html', function (t) {
  t.equal(
    m('<a><bab><c2c>'),
    '<p><a><bab><c2c></p>',
    'should support opening tags'
  )

  t.equal(
    m('<a/><b2/>'),
    '<p><a/><b2/></p>',
    'should support self-closing tags'
  )

  t.equal(
    m('<a  /><b2\ndata="foo" >'),
    '<p><a  /><b2\ndata="foo" ></p>',
    'should support whitespace in tags'
  )

  t.equal(
    m('<a foo="bar" bam = \'baz <em>"</em>\'\n_boolean zoop:33=zoop:33 />'),
    '<p><a foo="bar" bam = \'baz <em>"</em>\'\n_boolean zoop:33=zoop:33 /></p>',
    'should support attributes on tags'
  )

  t.equal(
    m('Foo <responsive-image src="foo.jpg" />'),
    '<p>Foo <responsive-image src="foo.jpg" /></p>',
    'should support custom tags'
  )

  t.equal(
    m('<33> <__>'),
    '<p>&lt;33&gt; &lt;__&gt;</p>',
    'should not support nonconforming tag names'
  )

  t.equal(
    m('<a h*#ref="hi">'),
    '<p>&lt;a h*#ref=&quot;hi&quot;&gt;</p>',
    'should not support nonconforming attribute names'
  )

  t.equal(
    m("<a href=\"hi'> <a href=hi'>"),
    "<p>&lt;a href=&quot;hi'&gt; &lt;a href=hi'&gt;</p>",
    'should not support nonconforming attribute values'
  )

  t.equal(
    m('< a><\nfoo><bar/ >\n<foo bar=baz\nbim!bop />'),
    '<p>&lt; a&gt;&lt;\nfoo&gt;&lt;bar/ &gt;\n&lt;foo bar=baz\nbim!bop /&gt;</p>',
    'should not support nonconforming whitespace'
  )

  t.equal(
    m("<a href='bar'title=title>"),
    "<p>&lt;a href='bar'title=title&gt;</p>",
    'should not support missing whitespace'
  )

  t.equal(m('</a></foo >'), '<p></a></foo ></p>', 'should support closing tags')

  t.equal(
    m('</a href="foo">'),
    '<p>&lt;/a href=&quot;foo&quot;&gt;</p>',
    'should not support closing tags with attributes'
  )

  t.equal(
    m('foo <!-- this is a\ncomment - with hyphen -->'),
    '<p>foo <!-- this is a\ncomment - with hyphen --></p>',
    'should support comments'
  )

  t.equal(
    m('foo <!-- not a comment -- two hyphens -->'),
    '<p>foo &lt;!-- not a comment -- two hyphens --&gt;</p>',
    'should not support comments with two dashes'
  )

  t.equal(
    m('foo <!--> foo -->'),
    '<p>foo &lt;!--&gt; foo --&gt;</p>',
    'should not support nonconforming comments (1)'
  )

  t.equal(
    m('foo <!-- foo--->'),
    '<p>foo &lt;!-- foo---&gt;</p>',
    'should not support nonconforming comments (2)'
  )

  t.equal(
    m('foo <?php echo $a; ?>'),
    '<p>foo <?php echo $a; ?></p>',
    'should support instructions'
  )

  t.equal(
    m('foo <!ELEMENT br EMPTY>'),
    '<p>foo <!ELEMENT br EMPTY></p>',
    'should support declarations'
  )

  t.equal(
    m('foo <![CDATA[>&<]]>'),
    '<p>foo <![CDATA[>&<]]></p>',
    'should support declarations'
  )

  t.equal(
    m('foo <a href="&ouml;">'),
    '<p>foo <a href="&ouml;"></p>',
    'should support (ignore) character references'
  )

  t.equal(
    m('foo <a href="\\*">'),
    '<p>foo <a href="\\*"></p>',
    'should not support character escapes (1)'
  )

  t.equal(
    m('<a href="\\"">'),
    '<p>&lt;a href=&quot;&quot;&quot;&gt;</p>',
    'should not support character escapes (2)'
  )

  // Our own extra tests.

  t.equal(
    m('foo <!1>'),
    '<p>foo &lt;!1&gt;</p>',
    'should not support non-comment, non-cdata, and non-named declaration'
  )

  t.equal(
    m('foo <!-not enough!-->'),
    '<p>foo &lt;!-not enough!--&gt;</p>',
    'should support comments with not enough dashes'
  )

  t.equal(
    m('foo <!---ok-->'),
    '<p>foo <!---ok--></p>',
    'should support comments that start with a dash, if it’s not followed by a greater than'
  )

  t.equal(
    m('foo <!--->'),
    '<p>foo &lt;!---&gt;</p>',
    'should not support comments that start with `->`'
  )

  t.equal(
    m('foo <!-- -> -->'),
    '<p>foo <!-- -> --></p>',
    'should support `->` in a comment'
  )

  t.equal(
    m('foo <!--'),
    '<p>foo &lt;!--</p>',
    'should not support EOF in a comment (1)'
  )

  t.equal(
    m('foo <!--a'),
    '<p>foo &lt;!--a</p>',
    'should not support EOF in a comment (2)'
  )

  t.equal(
    m('foo <!--a-'),
    '<p>foo &lt;!--a-</p>',
    'should not support EOF in a comment (3)'
  )

  t.equal(
    m('foo <!--a--'),
    '<p>foo &lt;!--a--</p>',
    'should not support EOF in a comment (4)'
  )

  t.equal(
    m('foo <![cdata[]]>'),
    '<p>foo &lt;![cdata[]]&gt;</p>',
    'should not support lowercase “cdata”'
  )

  t.equal(
    m('foo <![CDATA'),
    '<p>foo &lt;![CDATA</p>',
    'should not support EOF in a CDATA (1)'
  )

  t.equal(
    m('foo <![CDATA['),
    '<p>foo &lt;![CDATA[</p>',
    'should not support EOF in a CDATA (2)'
  )

  t.equal(
    m('foo <![CDATA[]'),
    '<p>foo &lt;![CDATA[]</p>',
    'should not support EOF in a CDATA (3)'
  )

  t.equal(
    m('foo <![CDATA[]]'),
    '<p>foo &lt;![CDATA[]]</p>',
    'should not support EOF in a CDATA (4)'
  )

  t.equal(
    m('foo <![CDATA[asd'),
    '<p>foo &lt;![CDATA[asd</p>',
    'should not support EOF in a CDATA (5)'
  )

  t.equal(
    m('foo <![CDATA[]]]]>'),
    '<p>foo <![CDATA[]]]]></p>',
    'should support end-like constructs in CDATA'
  )

  t.equal(
    m('foo <!doctype'),
    '<p>foo &lt;!doctype</p>',
    'should not support EOF in declarations'
  )

  t.equal(
    m('foo <?php'),
    '<p>foo &lt;?php</p>',
    'should not support EOF in instructions (1)'
  )

  t.equal(
    m('foo <?php?'),
    '<p>foo &lt;?php?</p>',
    'should not support EOF in instructions (2)'
  )

  t.equal(
    m('foo <???>'),
    '<p>foo <???></p>',
    'should support question marks in instructions'
  )

  t.equal(
    m('foo </3>'),
    '<p>foo &lt;/3&gt;</p>',
    'should not support closing tags that don’t start with alphas'
  )

  t.equal(
    m('foo </a->'),
    '<p>foo </a-></p>',
    'should support dashes in closing tags'
  )

  t.equal(
    m('foo </a   >'),
    '<p>foo </a   ></p>',
    'should support whitespace after closing tag names'
  )

  t.equal(
    m('foo </a!>'),
    '<p>foo &lt;/a!&gt;</p>',
    'should not support other characters after closing tag names'
  )

  t.equal(
    m('foo <a->'),
    '<p>foo <a-></p>',
    'should support dashes in opening tags'
  )

  t.equal(
    m('foo <a   >'),
    '<p>foo <a   ></p>',
    'should support whitespace after opening tag names'
  )

  t.equal(
    m('foo <a!>'),
    '<p>foo &lt;a!&gt;</p>',
    'should not support other characters after opening tag names'
  )

  t.equal(
    m('foo <a !>'),
    '<p>foo &lt;a !&gt;</p>',
    'should not support other characters in opening tags (1)'
  )

  t.equal(
    m('foo <a b!>'),
    '<p>foo &lt;a b!&gt;</p>',
    'should not support other characters in opening tags (2)'
  )

  t.equal(
    m('foo <a b/>'),
    '<p>foo <a b/></p>',
    'should support a slash after an attribute name'
  )

  t.equal(
    m('foo <a b>'),
    '<p>foo <a b></p>',
    'should support a greater than after an attribute name'
  )

  t.equal(
    m('foo <a b=<>'),
    '<p>foo &lt;a b=&lt;&gt;</p>',
    'should not support less than to start an unquoted attribute value'
  )

  t.equal(
    m('foo <a b=>>'),
    '<p>foo &lt;a b=&gt;&gt;</p>',
    'should not support greater than than to start an unquoted attribute value'
  )

  t.equal(
    m('foo <a b==>'),
    '<p>foo &lt;a b==&gt;</p>',
    'should not support equals to to start an unquoted attribute value'
  )

  t.equal(
    m('foo <a b=`>'),
    '<p>foo &lt;a b=`&gt;</p>',
    'should not support grave accent to start an unquoted attribute value'
  )

  t.equal(
    m('foo <a b="asd'),
    '<p>foo &lt;a b=&quot;asd</p>',
    'should not support EOF in double quoted attribute value'
  )

  t.equal(
    m("foo <a b='asd"),
    "<p>foo &lt;a b='asd</p>",
    'should not support EOF in single quoted attribute value'
  )

  t.equal(
    m('foo <a b=asd'),
    '<p>foo &lt;a b=asd</p>',
    'should not support EOF in unquoted attribute value'
  )

  t.end()
})
