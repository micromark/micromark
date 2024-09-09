import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('code', async function (t) {
  await t.test('should support code', async function () {
    assert.equal(micromark('`foo`'), '<p><code>foo</code></p>')
  })

  await t.test('should support code w/ more accents', async function () {
    assert.equal(micromark('`` foo ` bar ``'), '<p><code>foo ` bar</code></p>')
  })

  await t.test(
    'should support code w/ fences inside, and padding',
    async function () {
      assert.equal(micromark('` `` `'), '<p><code>``</code></p>')
    }
  )

  await t.test('should support code w/ extra padding', async function () {
    assert.equal(micromark('`  ``  `'), '<p><code> `` </code></p>')
  })

  await t.test(
    'should support code w/ padding and one character',
    async function () {
      assert.equal(micromark('`` ` ``'), '<p><code>`</code></p>')
    }
  )

  await t.test('should support code w/ unbalanced padding', async function () {
    assert.equal(micromark('` a`'), '<p><code> a</code></p>')
  })

  await t.test(
    'should support code w/ non-padding whitespace',
    async function () {
      assert.equal(micromark('` b `'), '<p><code> b </code></p>')
    }
  )

  await t.test('should support code w/o data', async function () {
    assert.equal(
      micromark('` `\n`  `'),
      '<p><code> </code>\n<code>  </code></p>'
    )
  })

  await t.test('should support code w/o line endings (1)', async function () {
    assert.equal(
      micromark('``\nfoo\nbar  \nbaz\n``'),
      '<p><code>foo bar   baz</code></p>'
    )
  })

  await t.test('should support code w/o line endings (2)', async function () {
    assert.equal(micromark('``\nfoo \n``'), '<p><code>foo </code></p>')
  })

  await t.test('should not support whitespace collapsing', async function () {
    assert.equal(
      micromark('`foo   bar \nbaz`'),
      '<p><code>foo   bar  baz</code></p>'
    )
  })

  await t.test('should not support character escapes', async function () {
    assert.equal(micromark('`foo\\`bar`'), '<p><code>foo\\</code>bar`</p>')
  })

  await t.test('should support more accents', async function () {
    assert.equal(micromark('``foo`bar``'), '<p><code>foo`bar</code></p>')
  })

  await t.test('should support less accents', async function () {
    assert.equal(micromark('` foo `` bar `'), '<p><code>foo `` bar</code></p>')
  })

  await t.test('should precede over emphasis', async function () {
    assert.equal(micromark('*foo`*`'), '<p>*foo<code>*</code></p>')
  })

  await t.test('should precede over links', async function () {
    assert.equal(
      micromark('[not a `link](/foo`)'),
      '<p>[not a <code>link](/foo</code>)</p>'
    )
  })

  await t.test('should have same precedence as HTML (1)', async function () {
    assert.equal(
      micromark('`<a href="`">`'),
      '<p><code>&lt;a href=&quot;</code>&quot;&gt;`</p>'
    )
  })

  await t.test('should have same precedence as HTML (2)', async function () {
    assert.equal(
      micromark('<a href="`">`', {allowDangerousHtml: true}),
      '<p><a href="`">`</p>'
    )
  })

  await t.test(
    'should have same precedence as autolinks (1)',
    async function () {
      assert.equal(
        micromark('`<http://foo.bar.`baz>`'),
        '<p><code>&lt;http://foo.bar.</code>baz&gt;`</p>'
      )
    }
  )

  await t.test(
    'should have same precedence as autolinks (2)',
    async function () {
      assert.equal(
        micromark('<http://foo.bar.`baz>`'),
        '<p><a href="http://foo.bar.%60baz">http://foo.bar.`baz</a>`</p>'
      )
    }
  )

  await t.test(
    'should not support more accents before a fence',
    async function () {
      assert.equal(micromark('```foo``'), '<p>```foo``</p>')
    }
  )

  await t.test('should not support no closing fence (1)', async function () {
    assert.equal(micromark('`foo'), '<p>`foo</p>')
  })

  await t.test('should not support no closing fence (2)', async function () {
    assert.equal(micromark('`foo``bar``'), '<p>`foo<code>bar</code></p>')
  })

  await t.test('should support tabs in code', async function () {
    // Extra:
    assert.equal(micromark('`foo\t\tbar`'), '<p><code>foo\t\tbar</code></p>')
  })

  await t.test(
    'should support an escaped initial grave accent',
    async function () {
      assert.equal(micromark('\\``x`'), '<p>`<code>x</code></p>')
    }
  )

  await t.test('should support turning off code (text)', async function () {
    assert.equal(
      micromark('`a`', {extensions: [{disable: {null: ['codeText']}}]}),
      '<p>`a`</p>'
    )
  })
})
