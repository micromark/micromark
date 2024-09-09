import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('heading-atx', async function (t) {
  await t.test('should support a heading w/ rank 1', async function () {
    assert.equal(micromark('# foo'), '<h1>foo</h1>')
  })

  await t.test('should support a heading w/ rank 2', async function () {
    assert.equal(micromark('## foo'), '<h2>foo</h2>')
  })

  await t.test('should support a heading w/ rank 3', async function () {
    assert.equal(micromark('### foo'), '<h3>foo</h3>')
  })

  await t.test('should support a heading w/ rank 4', async function () {
    assert.equal(micromark('#### foo'), '<h4>foo</h4>')
  })

  await t.test('should support a heading w/ rank 5', async function () {
    assert.equal(micromark('##### foo'), '<h5>foo</h5>')
  })

  await t.test('should support a heading w/ rank 6', async function () {
    assert.equal(micromark('###### foo'), '<h6>foo</h6>')
  })

  await t.test('should not support a heading w/ rank 7', async function () {
    assert.equal(micromark('####### foo'), '<p>####### foo</p>')
  })

  await t.test(
    'should not support a heading for a number sign not followed by whitespace (1)',
    async function () {
      assert.equal(micromark('#5 bolt'), '<p>#5 bolt</p>')
    }
  )

  await t.test(
    'should not support a heading for a number sign not followed by whitespace (2)',
    async function () {
      assert.equal(micromark('#hashtag'), '<p>#hashtag</p>')
    }
  )

  await t.test(
    'should not support a heading for an escaped number sign',
    async function () {
      assert.equal(micromark('\\## foo'), '<p>## foo</p>')
    }
  )

  await t.test('should support text content in headings', async function () {
    assert.equal(
      micromark('# foo *bar* \\*baz\\*'),
      '<h1>foo <em>bar</em> *baz*</h1>'
    )
  })

  await t.test(
    'should support arbitrary initial and final whitespace',
    async function () {
      assert.equal(
        micromark('#                  foo                     '),
        '<h1>foo</h1>'
      )
    }
  )

  await t.test('should support an initial space', async function () {
    assert.equal(micromark(' ### foo'), '<h3>foo</h3>')
  })

  await t.test('should support two initial spaces', async function () {
    assert.equal(micromark('  ## foo'), '<h2>foo</h2>')
  })

  await t.test('should support three initial spaces', async function () {
    assert.equal(micromark('   # foo'), '<h1>foo</h1>')
  })

  await t.test('should not support four initial spaces', async function () {
    assert.equal(micromark('    # foo'), '<pre><code># foo\n</code></pre>')
  })

  await t.test(
    'should not support four initial spaces when interrupting',
    async function () {
      assert.equal(micromark('foo\n    # bar'), '<p>foo\n# bar</p>')
    }
  )

  await t.test('should support a closing sequence (1)', async function () {
    assert.equal(micromark('## foo ##'), '<h2>foo</h2>')
  })

  await t.test('should support a closing sequence (2)', async function () {
    assert.equal(micromark('  ###   bar    ###'), '<h3>bar</h3>')
  })

  await t.test(
    'should support a closing sequence w/ an arbitrary number of number signs (1)',
    async function () {
      assert.equal(
        micromark('# foo ##################################'),
        '<h1>foo</h1>'
      )
    }
  )

  await t.test(
    'should support a closing sequence w/ an arbitrary number of number signs (2)',
    async function () {
      assert.equal(micromark('##### foo ##'), '<h5>foo</h5>')
    }
  )

  await t.test(
    'should support trailing whitespace after a closing sequence',
    async function () {
      assert.equal(micromark('### foo ###     '), '<h3>foo</h3>')
    }
  )

  await t.test(
    'should not support other content after a closing sequence',
    async function () {
      assert.equal(micromark('### foo ### b'), '<h3>foo ### b</h3>')
    }
  )

  await t.test(
    'should not support a closing sequence w/o whitespace before it',
    async function () {
      assert.equal(micromark('# foo#'), '<h1>foo#</h1>')
    }
  )

  await t.test(
    'should not support an “escaped” closing sequence (1)',
    async function () {
      assert.equal(micromark('### foo \\###'), '<h3>foo ###</h3>')
    }
  )

  await t.test(
    'should not support an “escaped” closing sequence (2)',
    async function () {
      assert.equal(micromark('## foo #\\##'), '<h2>foo ###</h2>')
    }
  )

  await t.test(
    'should not support an “escaped” closing sequence (3)',
    async function () {
      assert.equal(micromark('# foo \\#'), '<h1>foo #</h1>')
    }
  )

  await t.test(
    'should support atx headings when not surrounded by blank lines',
    async function () {
      assert.equal(
        micromark('****\n## foo\n****'),
        '<hr />\n<h2>foo</h2>\n<hr />'
      )
    }
  )

  await t.test(
    'should support atx headings interrupting paragraphs',
    async function () {
      assert.equal(
        micromark('Foo bar\n# baz\nBar foo'),
        '<p>Foo bar</p>\n<h1>baz</h1>\n<p>Bar foo</p>'
      )
    }
  )

  await t.test('should support empty atx headings', async function () {
    assert.equal(
      micromark('## \n#\n### ###'),
      '<h2></h2>\n<h1></h1>\n<h3></h3>'
    )
  })

  await t.test('should not support lazyness (1)', async function () {
    assert.equal(
      micromark('> #\na'),
      '<blockquote>\n<h1></h1>\n</blockquote>\n<p>a</p>'
    )
  })

  await t.test('should not support lazyness (2)', async function () {
    assert.equal(
      micromark('> a\n#'),
      '<blockquote>\n<p>a</p>\n</blockquote>\n<h1></h1>'
    )
  })

  await t.test('should support turning off heading (atx)', async function () {
    assert.equal(
      micromark('# a', {extensions: [{disable: {null: ['headingAtx']}}]}),
      '<p># a</p>'
    )
  })
})
