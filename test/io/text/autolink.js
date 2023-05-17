import {micromark} from 'micromark'
import test from 'tape'

test('autolink', function (t) {
  t.equal(
    micromark('<http://foo.bar.baz>'),
    '<p><a href="http://foo.bar.baz">http://foo.bar.baz</a></p>',
    'should support protocol autolinks (1)'
  )

  t.equal(
    micromark('<http://foo.bar.baz/test?q=hello&id=22&boolean>'),
    '<p><a href="http://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean">http://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean</a></p>',
    'should support protocol autolinks (2)'
  )

  t.equal(
    micromark('<irc://foo.bar:2233/baz>'),
    '<p><a href="irc://foo.bar:2233/baz">irc://foo.bar:2233/baz</a></p>',
    'should support protocol autolinks w/ non-HTTP schemes'
  )

  t.equal(
    micromark('<MAILTO:FOO@BAR.BAZ>'),
    '<p><a href="MAILTO:FOO@BAR.BAZ">MAILTO:FOO@BAR.BAZ</a></p>',
    'should support protocol autolinks in uppercase'
  )

  t.equal(
    micromark('<a+b+c:d>', {allowDangerousProtocol: true}),
    '<p><a href="a+b+c:d">a+b+c:d</a></p>',
    'should support protocol autolinks w/ incorrect URIs (1)'
  )

  t.equal(
    micromark('<made-up-scheme://foo,bar>', {allowDangerousProtocol: true}),
    '<p><a href="made-up-scheme://foo,bar">made-up-scheme://foo,bar</a></p>',
    'should support protocol autolinks w/ incorrect URIs (2)'
  )

  t.equal(
    micromark('<http://../>'),
    '<p><a href="http://../">http://../</a></p>',
    'should support protocol autolinks w/ incorrect URIs (3)'
  )

  t.equal(
    micromark('<localhost:5001/foo>', {allowDangerousProtocol: true}),
    '<p><a href="localhost:5001/foo">localhost:5001/foo</a></p>',
    'should support protocol autolinks w/ incorrect URIs (4)'
  )

  t.equal(
    micromark('<http://foo.bar/baz bim>'),
    '<p>&lt;http://foo.bar/baz bim&gt;</p>',
    'should not support protocol autolinks w/ spaces'
  )

  t.equal(
    micromark('<http://example.com/\\[\\>'),
    '<p><a href="http://example.com/%5C%5B%5C">http://example.com/\\[\\</a></p>',
    'should not support character escapes in protocol autolinks'
  )

  t.equal(
    micromark('<foo@bar.example.com>'),
    '<p><a href="mailto:foo@bar.example.com">foo@bar.example.com</a></p>',
    'should support email autolinks (1)'
  )

  t.equal(
    micromark('<foo+special@Bar.baz-bar0.com>'),
    '<p><a href="mailto:foo+special@Bar.baz-bar0.com">foo+special@Bar.baz-bar0.com</a></p>',
    'should support email autolinks (2)'
  )

  t.equal(
    micromark('<a@b.c>'),
    '<p><a href="mailto:a@b.c">a@b.c</a></p>',
    'should support email autolinks (3)'
  )

  t.equal(
    micromark('<foo\\+@bar.example.com>'),
    '<p>&lt;foo+@bar.example.com&gt;</p>',
    'should not support character escapes in email autolinks'
  )

  t.equal(
    micromark('<>'),
    '<p>&lt;&gt;</p>',
    'should not support empty autolinks'
  )

  t.equal(
    micromark('< http://foo.bar >'),
    '<p>&lt; http://foo.bar &gt;</p>',
    'should not support autolinks w/ space'
  )

  t.equal(
    micromark('<m:abc>'),
    '<p>&lt;m:abc&gt;</p>',
    'should not support autolinks w/ a single character for a scheme'
  )

  t.equal(
    micromark('<foo.bar.baz>'),
    '<p>&lt;foo.bar.baz&gt;</p>',
    'should not support autolinks w/o a colon or at sign'
  )

  t.equal(
    micromark('http://example.com'),
    '<p>http://example.com</p>',
    'should not support protocol autolinks w/o angle brackets'
  )

  t.equal(
    micromark('foo@bar.example.com'),
    '<p>foo@bar.example.com</p>',
    'should not support email autolinks w/o angle brackets'
  )

  // Extra:
  t.equal(
    micromark('<*@example.com>'),
    '<p><a href="mailto:*@example.com">*@example.com</a></p>',
    'should support autolinks w/ atext (1)'
  )
  t.equal(
    micromark('<a*@example.com>'),
    '<p><a href="mailto:a*@example.com">a*@example.com</a></p>',
    'should support autolinks w/ atext (2)'
  )
  t.equal(
    micromark('<aa*@example.com>'),
    '<p><a href="mailto:aa*@example.com">aa*@example.com</a></p>',
    'should support autolinks w/ atext (3)'
  )

  t.equal(
    micromark('<aaa©@example.com>'),
    '<p>&lt;aaa©@example.com&gt;</p>',
    'should support non-atext in email autolinks local part (1)'
  )
  t.equal(
    micromark('<a*a©@example.com>'),
    '<p>&lt;a*a©@example.com&gt;</p>',
    'should support non-atext in email autolinks local part (2)'
  )

  t.equal(
    micromark('<asd@.example.com>'),
    '<p>&lt;asd@.example.com&gt;</p>',
    'should not support a dot after an at sign in email autolinks'
  )
  t.equal(
    micromark('<asd@e..xample.com>'),
    '<p>&lt;asd@e..xample.com&gt;</p>',
    'should not support a dot after another dot in email autolinks'
  )

  t.equal(
    micromark(
      '<asd@012345678901234567890123456789012345678901234567890123456789012>'
    ),
    '<p><a href="mailto:asd@012345678901234567890123456789012345678901234567890123456789012">asd@012345678901234567890123456789012345678901234567890123456789012</a></p>',
    'should support 63 character in email autolinks domains'
  )

  t.equal(
    micromark(
      '<asd@0123456789012345678901234567890123456789012345678901234567890123>'
    ),
    '<p>&lt;asd@0123456789012345678901234567890123456789012345678901234567890123&gt;</p>',
    'should not support 64 character in email autolinks domains'
  )

  t.equal(
    micromark(
      '<asd@012345678901234567890123456789012345678901234567890123456789012.a>'
    ),
    '<p><a href="mailto:asd@012345678901234567890123456789012345678901234567890123456789012.a">asd@012345678901234567890123456789012345678901234567890123456789012.a</a></p>',
    'should support a TLD after a 63 character domain in email autolinks'
  )

  t.equal(
    micromark(
      '<asd@0123456789012345678901234567890123456789012345678901234567890123.a>'
    ),
    '<p>&lt;asd@0123456789012345678901234567890123456789012345678901234567890123.a&gt;</p>',
    'should not support a TLD after a 64 character domain in email autolinks'
  )

  t.equal(
    micromark(
      '<asd@a.012345678901234567890123456789012345678901234567890123456789012>'
    ),
    '<p><a href="mailto:asd@a.012345678901234567890123456789012345678901234567890123456789012">asd@a.012345678901234567890123456789012345678901234567890123456789012</a></p>',
    'should support a 63 character TLD in email autolinks'
  )

  t.equal(
    micromark(
      '<asd@a.0123456789012345678901234567890123456789012345678901234567890123>'
    ),
    '<p>&lt;asd@a.0123456789012345678901234567890123456789012345678901234567890123&gt;</p>',
    'should not support a 64 character TLD in email autolinks'
  )

  t.equal(
    micromark('<asd@-example.com>'),
    '<p>&lt;asd@-example.com&gt;</p>',
    'should not support a dash after `@` in email autolinks'
  )

  t.equal(
    micromark('<asd@e-xample.com>'),
    '<p><a href="mailto:asd@e-xample.com">asd@e-xample.com</a></p>',
    'should support a dash after other domain characters in email autolinks'
  )

  t.equal(
    micromark('<asd@e--xample.com>'),
    '<p><a href="mailto:asd@e--xample.com">asd@e--xample.com</a></p>',
    'should support a dash after another dash in email autolinks'
  )

  t.equal(
    micromark('<asd@example-.com>'),
    '<p>&lt;asd@example-.com&gt;</p>',
    'should not support a dash before a dot in email autolinks'
  )

  t.equal(
    micromark('<a@b.co>', {extensions: [{disable: {null: ['autolink']}}]}),
    '<p>&lt;a@b.co&gt;</p>',
    'should support turning off autolinks'
  )

  t.end()
})
