import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('code', function () {
  assert.equal(
    micromark('`foo`'),
    '<p><code>foo</code></p>',
    'should support code'
  )

  assert.equal(
    micromark('`` foo ` bar ``'),
    '<p><code>foo ` bar</code></p>',
    'should support code w/ more accents'
  )

  assert.equal(
    micromark('` `` `'),
    '<p><code>``</code></p>',
    'should support code w/ fences inside, and padding'
  )

  assert.equal(
    micromark('`  ``  `'),
    '<p><code> `` </code></p>',
    'should support code w/ extra padding'
  )

  assert.equal(
    micromark('`` ` ``'),
    '<p><code>`</code></p>',
    'should support code w/ padding and one character'
  )

  assert.equal(
    micromark('` a`'),
    '<p><code> a</code></p>',
    'should support code w/ unbalanced padding'
  )

  assert.equal(
    micromark('` b `'),
    '<p><code> b </code></p>',
    'should support code w/ non-padding whitespace'
  )

  assert.equal(
    micromark('` `\n`  `'),
    '<p><code> </code>\n<code>  </code></p>',
    'should support code w/o data'
  )

  assert.equal(
    micromark('``\nfoo\nbar  \nbaz\n``'),
    '<p><code>foo bar   baz</code></p>',
    'should support code w/o line endings (1)'
  )

  assert.equal(
    micromark('``\nfoo \n``'),
    '<p><code>foo </code></p>',
    'should support code w/o line endings (2)'
  )

  assert.equal(
    micromark('`foo   bar \nbaz`'),
    '<p><code>foo   bar  baz</code></p>',
    'should not support whitespace collapsing'
  )

  assert.equal(
    micromark('`foo\\`bar`'),
    '<p><code>foo\\</code>bar`</p>',
    'should not support character escapes'
  )

  assert.equal(
    micromark('``foo`bar``'),
    '<p><code>foo`bar</code></p>',
    'should support more accents'
  )

  assert.equal(
    micromark('` foo `` bar `'),
    '<p><code>foo `` bar</code></p>',
    'should support less accents'
  )

  assert.equal(
    micromark('*foo`*`'),
    '<p>*foo<code>*</code></p>',
    'should precede over emphasis'
  )

  assert.equal(
    micromark('[not a `link](/foo`)'),
    '<p>[not a <code>link](/foo</code>)</p>',
    'should precede over links'
  )

  assert.equal(
    micromark('`<a href="`">`'),
    '<p><code>&lt;a href=&quot;</code>&quot;&gt;`</p>',
    'should have same precedence as HTML (1)'
  )

  assert.equal(
    micromark('<a href="`">`', {allowDangerousHtml: true}),
    '<p><a href="`">`</p>',
    'should have same precedence as HTML (2)'
  )

  assert.equal(
    micromark('`<http://foo.bar.`baz>`'),
    '<p><code>&lt;http://foo.bar.</code>baz&gt;`</p>',
    'should have same precedence as autolinks (1)'
  )

  assert.equal(
    micromark('<http://foo.bar.`baz>`'),
    '<p><a href="http://foo.bar.%60baz">http://foo.bar.`baz</a>`</p>',
    'should have same precedence as autolinks (2)'
  )

  assert.equal(
    micromark('```foo``'),
    '<p>```foo``</p>',
    'should not support more accents before a fence'
  )

  assert.equal(
    micromark('`foo'),
    '<p>`foo</p>',
    'should not support no closing fence (1)'
  )

  assert.equal(
    micromark('`foo``bar``'),
    '<p>`foo<code>bar</code></p>',
    'should not support no closing fence (2)'
  )

  // Extra:
  assert.equal(
    micromark('`foo\t\tbar`'),
    '<p><code>foo\t\tbar</code></p>',
    'should support tabs in code'
  )

  assert.equal(
    micromark('\\``x`'),
    '<p>`<code>x</code></p>',
    'should support an escaped initial grave accent'
  )

  assert.equal(
    micromark('`a`', {extensions: [{disable: {null: ['codeText']}}]}),
    '<p>`a`</p>',
    'should support turning off code (text)'
  )
})
