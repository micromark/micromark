import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('thematic-break', async function (t) {
  await t.test(
    'should support thematic breaks w/ asterisks, dashes, and underscores',
    async function () {
      assert.equal(micromark('***\n---\n___'), '<hr />\n<hr />\n<hr />')
    }
  )

  await t.test(
    'should not support thematic breaks w/ plusses',
    async function () {
      assert.equal(micromark('+++'), '<p>+++</p>')
    }
  )

  await t.test(
    'should not support thematic breaks w/ equals',
    async function () {
      assert.equal(micromark('==='), '<p>===</p>')
    }
  )

  await t.test(
    'should not support thematic breaks w/ two dashes',
    async function () {
      assert.equal(micromark('--'), '<p>--</p>')
    }
  )

  await t.test(
    'should not support thematic breaks w/ two asterisks',
    async function () {
      assert.equal(micromark('**'), '<p>**</p>')
    }
  )

  await t.test(
    'should not support thematic breaks w/ two underscores',
    async function () {
      assert.equal(micromark('__'), '<p>__</p>')
    }
  )

  await t.test('should support thematic breaks w/ 1 space', async function () {
    assert.equal(micromark(' ***'), '<hr />')
  })

  await t.test('should support thematic breaks w/ 2 spaces', async function () {
    assert.equal(micromark('  ***'), '<hr />')
  })

  await t.test('should support thematic breaks w/ 3 spaces', async function () {
    assert.equal(micromark('   ***'), '<hr />')
  })

  await t.test(
    'should not support thematic breaks w/ 4 spaces',
    async function () {
      assert.equal(micromark('    ***'), '<pre><code>***\n</code></pre>')
    }
  )

  await t.test(
    'should not support thematic breaks w/ 4 spaces as paragraph continuation',
    async function () {
      assert.equal(micromark('Foo\n    ***'), '<p>Foo\n***</p>')
    }
  )

  await t.test(
    'should support thematic breaks w/ many markers',
    async function () {
      assert.equal(micromark('_____________________________________'), '<hr />')
    }
  )

  await t.test(
    'should support thematic breaks w/ spaces (1)',
    async function () {
      assert.equal(micromark(' - - -'), '<hr />')
    }
  )

  await t.test(
    'should support thematic breaks w/ spaces (2)',
    async function () {
      assert.equal(micromark(' **  * ** * ** * **'), '<hr />')
    }
  )

  await t.test(
    'should support thematic breaks w/ spaces (3)',
    async function () {
      assert.equal(micromark('-     -      -      -'), '<hr />')
    }
  )

  await t.test(
    'should support thematic breaks w/ trailing spaces',
    async function () {
      assert.equal(micromark('- - - -    '), '<hr />')
    }
  )

  await t.test(
    'should not support thematic breaks w/ other characters (1)',
    async function () {
      assert.equal(micromark('_ _ _ _ a'), '<p>_ _ _ _ a</p>')
    }
  )

  await t.test(
    'should not support thematic breaks w/ other characters (2)',
    async function () {
      assert.equal(micromark('a------'), '<p>a------</p>')
    }
  )

  await t.test(
    'should not support thematic breaks w/ other characters (3)',
    async function () {
      assert.equal(micromark('---a---'), '<p>---a---</p>')
    }
  )

  await t.test(
    'should not support thematic breaks w/ mixed markers',
    async function () {
      assert.equal(micromark(' *-*'), '<p><em>-</em></p>')
    }
  )

  await t.test(
    'should support thematic breaks mixed w/ lists (1)',
    async function () {
      assert.equal(
        micromark('- foo\n***\n- bar'),
        '<ul>\n<li>foo</li>\n</ul>\n<hr />\n<ul>\n<li>bar</li>\n</ul>'
      )
    }
  )

  await t.test(
    'should support thematic breaks mixed w/ lists (2)',
    async function () {
      assert.equal(
        micromark('* Foo\n* * *\n* Bar'),
        '<ul>\n<li>Foo</li>\n</ul>\n<hr />\n<ul>\n<li>Bar</li>\n</ul>'
      )
    }
  )

  await t.test(
    'should support thematic breaks interrupting paragraphs',
    async function () {
      assert.equal(micromark('Foo\n***\nbar'), '<p>Foo</p>\n<hr />\n<p>bar</p>')
    }
  )

  await t.test(
    'should not support thematic breaks w/ dashes interrupting paragraphs (setext heading)',
    async function () {
      assert.equal(micromark('Foo\n---\nbar'), '<h2>Foo</h2>\n<p>bar</p>')
    }
  )

  await t.test('should support thematic breaks in lists', async function () {
    assert.equal(
      micromark('- Foo\n- * * *'),
      '<ul>\n<li>Foo</li>\n<li>\n<hr />\n</li>\n</ul>'
    )
  })

  await t.test('should not support lazyness (1)', async function () {
    assert.equal(
      micromark('> ---\na'),
      '<blockquote>\n<hr />\n</blockquote>\n<p>a</p>'
    )
  })

  await t.test('should not support lazyness (2)', async function () {
    assert.equal(
      micromark('> a\n---'),
      '<blockquote>\n<p>a</p>\n</blockquote>\n<hr />'
    )
  })

  await t.test('should support turning off thematic breaks', async function () {
    assert.equal(
      micromark('***', {extensions: [{disable: {null: ['thematicBreak']}}]}),
      '<p>***</p>'
    )
  })
})
