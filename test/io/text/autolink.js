import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('autolink', async function (t) {
  await t.test('should support protocol autolinks (1)', async function () {
    assert.equal(
      micromark('<http://foo.bar.baz>'),
      '<p><a href="http://foo.bar.baz">http://foo.bar.baz</a></p>'
    )
  })

  await t.test('should support protocol autolinks (2)', async function () {
    assert.equal(
      micromark('<http://foo.bar.baz/test?q=hello&id=22&boolean>'),
      '<p><a href="http://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean">http://foo.bar.baz/test?q=hello&amp;id=22&amp;boolean</a></p>'
    )
  })

  await t.test(
    'should support protocol autolinks w/ non-HTTP schemes',
    async function () {
      assert.equal(
        micromark('<irc://foo.bar:2233/baz>'),
        '<p><a href="irc://foo.bar:2233/baz">irc://foo.bar:2233/baz</a></p>'
      )
    }
  )

  await t.test(
    'should support protocol autolinks in uppercase',
    async function () {
      assert.equal(
        micromark('<MAILTO:FOO@BAR.BAZ>'),
        '<p><a href="MAILTO:FOO@BAR.BAZ">MAILTO:FOO@BAR.BAZ</a></p>'
      )
    }
  )

  await t.test(
    'should support protocol autolinks w/ incorrect URIs (1)',
    async function () {
      assert.equal(
        micromark('<a+b+c:d>', {allowDangerousProtocol: true}),
        '<p><a href="a+b+c:d">a+b+c:d</a></p>'
      )
    }
  )

  await t.test(
    'should support protocol autolinks w/ incorrect URIs (2)',
    async function () {
      assert.equal(
        micromark('<made-up-scheme://foo,bar>', {allowDangerousProtocol: true}),
        '<p><a href="made-up-scheme://foo,bar">made-up-scheme://foo,bar</a></p>'
      )
    }
  )

  await t.test(
    'should support protocol autolinks w/ incorrect URIs (3)',
    async function () {
      assert.equal(
        micromark('<http://../>'),
        '<p><a href="http://../">http://../</a></p>'
      )
    }
  )

  await t.test(
    'should support protocol autolinks w/ incorrect URIs (4)',
    async function () {
      assert.equal(
        micromark('<localhost:5001/foo>', {allowDangerousProtocol: true}),
        '<p><a href="localhost:5001/foo">localhost:5001/foo</a></p>'
      )
    }
  )

  await t.test(
    'should not support protocol autolinks w/ spaces',
    async function () {
      assert.equal(
        micromark('<http://foo.bar/baz bim>'),
        '<p>&lt;http://foo.bar/baz bim&gt;</p>'
      )
    }
  )

  await t.test(
    'should not support character escapes in protocol autolinks',
    async function () {
      assert.equal(
        micromark('<http://example.com/\\[\\>'),
        '<p><a href="http://example.com/%5C%5B%5C">http://example.com/\\[\\</a></p>'
      )
    }
  )

  await t.test('should support email autolinks (1)', async function () {
    assert.equal(
      micromark('<foo@bar.example.com>'),
      '<p><a href="mailto:foo@bar.example.com">foo@bar.example.com</a></p>'
    )
  })

  await t.test('should support email autolinks (2)', async function () {
    assert.equal(
      micromark('<foo+special@Bar.baz-bar0.com>'),
      '<p><a href="mailto:foo+special@Bar.baz-bar0.com">foo+special@Bar.baz-bar0.com</a></p>'
    )
  })

  await t.test('should support email autolinks (3)', async function () {
    assert.equal(
      micromark('<a@b.c>'),
      '<p><a href="mailto:a@b.c">a@b.c</a></p>'
    )
  })

  await t.test(
    'should not support character escapes in email autolinks',
    async function () {
      assert.equal(
        micromark('<foo\\+@bar.example.com>'),
        '<p>&lt;foo+@bar.example.com&gt;</p>'
      )
    }
  )

  await t.test('should not support empty autolinks', async function () {
    assert.equal(micromark('<>'), '<p>&lt;&gt;</p>')
  })

  await t.test('should not support autolinks w/ space', async function () {
    assert.equal(
      micromark('< http://foo.bar >'),
      '<p>&lt; http://foo.bar &gt;</p>'
    )
  })

  await t.test(
    'should not support autolinks w/ a single character for a scheme',
    async function () {
      assert.equal(micromark('<m:abc>'), '<p>&lt;m:abc&gt;</p>')
    }
  )

  await t.test(
    'should not support autolinks w/o a colon or at sign',
    async function () {
      assert.equal(micromark('<foo.bar.baz>'), '<p>&lt;foo.bar.baz&gt;</p>')
    }
  )

  await t.test(
    'should not support protocol autolinks w/o angle brackets',
    async function () {
      assert.equal(micromark('http://example.com'), '<p>http://example.com</p>')
    }
  )

  await t.test(
    'should not support email autolinks w/o angle brackets',
    async function () {
      assert.equal(
        micromark('foo@bar.example.com'),
        '<p>foo@bar.example.com</p>'
      )
    }
  )

  await t.test('should support autolinks w/ atext (1)', async function () {
    // Extra:
    assert.equal(
      micromark('<*@example.com>'),
      '<p><a href="mailto:*@example.com">*@example.com</a></p>'
    )
  })

  await t.test('should support autolinks w/ atext (2)', async function () {
    assert.equal(
      micromark('<a*@example.com>'),
      '<p><a href="mailto:a*@example.com">a*@example.com</a></p>'
    )
  })

  await t.test('should support autolinks w/ atext (3)', async function () {
    assert.equal(
      micromark('<aa*@example.com>'),
      '<p><a href="mailto:aa*@example.com">aa*@example.com</a></p>'
    )
  })

  await t.test(
    'should support non-atext in email autolinks local part (1)',
    async function () {
      assert.equal(
        micromark('<aaa©@example.com>'),
        '<p>&lt;aaa©@example.com&gt;</p>'
      )
    }
  )

  await t.test(
    'should support non-atext in email autolinks local part (2)',
    async function () {
      assert.equal(
        micromark('<a*a©@example.com>'),
        '<p>&lt;a*a©@example.com&gt;</p>'
      )
    }
  )

  await t.test(
    'should not support a dot after an at sign in email autolinks',
    async function () {
      assert.equal(
        micromark('<asd@.example.com>'),
        '<p>&lt;asd@.example.com&gt;</p>'
      )
    }
  )

  await t.test(
    'should not support a dot after another dot in email autolinks',
    async function () {
      assert.equal(
        micromark('<asd@e..xample.com>'),
        '<p>&lt;asd@e..xample.com&gt;</p>'
      )
    }
  )

  await t.test(
    'should support 63 character in email autolinks domains',
    async function () {
      assert.equal(
        micromark(
          '<asd@012345678901234567890123456789012345678901234567890123456789012>'
        ),
        '<p><a href="mailto:asd@012345678901234567890123456789012345678901234567890123456789012">asd@012345678901234567890123456789012345678901234567890123456789012</a></p>'
      )
    }
  )

  await t.test(
    'should not support 64 character in email autolinks domains',
    async function () {
      assert.equal(
        micromark(
          '<asd@0123456789012345678901234567890123456789012345678901234567890123>'
        ),
        '<p>&lt;asd@0123456789012345678901234567890123456789012345678901234567890123&gt;</p>'
      )
    }
  )

  await t.test(
    'should support a TLD after a 63 character domain in email autolinks',
    async function () {
      assert.equal(
        micromark(
          '<asd@012345678901234567890123456789012345678901234567890123456789012.a>'
        ),
        '<p><a href="mailto:asd@012345678901234567890123456789012345678901234567890123456789012.a">asd@012345678901234567890123456789012345678901234567890123456789012.a</a></p>'
      )
    }
  )

  await t.test(
    'should not support a TLD after a 64 character domain in email autolinks',
    async function () {
      assert.equal(
        micromark(
          '<asd@0123456789012345678901234567890123456789012345678901234567890123.a>'
        ),
        '<p>&lt;asd@0123456789012345678901234567890123456789012345678901234567890123.a&gt;</p>'
      )
    }
  )

  await t.test(
    'should support a 63 character TLD in email autolinks',
    async function () {
      assert.equal(
        micromark(
          '<asd@a.012345678901234567890123456789012345678901234567890123456789012>'
        ),
        '<p><a href="mailto:asd@a.012345678901234567890123456789012345678901234567890123456789012">asd@a.012345678901234567890123456789012345678901234567890123456789012</a></p>'
      )
    }
  )

  await t.test(
    'should not support a 64 character TLD in email autolinks',
    async function () {
      assert.equal(
        micromark(
          '<asd@a.0123456789012345678901234567890123456789012345678901234567890123>'
        ),
        '<p>&lt;asd@a.0123456789012345678901234567890123456789012345678901234567890123&gt;</p>'
      )
    }
  )

  await t.test(
    'should not support a dash after `@` in email autolinks',
    async function () {
      assert.equal(
        micromark('<asd@-example.com>'),
        '<p>&lt;asd@-example.com&gt;</p>'
      )
    }
  )

  await t.test(
    'should support a dash after other domain characters in email autolinks',
    async function () {
      assert.equal(
        micromark('<asd@e-xample.com>'),
        '<p><a href="mailto:asd@e-xample.com">asd@e-xample.com</a></p>'
      )
    }
  )

  await t.test(
    'should support a dash after another dash in email autolinks',
    async function () {
      assert.equal(
        micromark('<asd@e--xample.com>'),
        '<p><a href="mailto:asd@e--xample.com">asd@e--xample.com</a></p>'
      )
    }
  )

  await t.test(
    'should not support a dash before a dot in email autolinks',
    async function () {
      assert.equal(
        micromark('<asd@example-.com>'),
        '<p>&lt;asd@example-.com&gt;</p>'
      )
    }
  )

  await t.test(
    'should not support an at sign at the start of email autolinks',
    async function () {
      assert.equal(micromark('<@example.com>'), '<p>&lt;@example.com&gt;</p>')
    }
  )

  await t.test('should support turning off autolinks', async function () {
    assert.equal(
      micromark('<a@b.co>', {extensions: [{disable: {null: ['autolink']}}]}),
      '<p>&lt;a@b.co&gt;</p>'
    )
  })
})
