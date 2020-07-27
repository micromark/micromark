'use strict'

var test = require('tape')
var m = require('../../..')

test('code', function (t) {
  t.equal(m('`foo`'), '<p><code>foo</code></p>', 'should support code')

  t.equal(
    m('`` foo ` bar ``'),
    '<p><code>foo ` bar</code></p>',
    'should support code w/ more accents'
  )

  t.equal(
    m('` `` `'),
    '<p><code>``</code></p>',
    'should support code w/ fences inside, and padding'
  )

  t.equal(
    m('`  ``  `'),
    '<p><code> `` </code></p>',
    'should support code w/ extra padding'
  )

  t.equal(
    m('` a`'),
    '<p><code> a</code></p>',
    'should support code w/ unbalanced padding'
  )

  t.equal(
    m('` b `'),
    '<p><code> b </code></p>',
    'should support code w/ non-padding whitespace'
  )

  t.equal(
    m('` `\n`  `'),
    '<p><code> </code>\n<code>  </code></p>',
    'should support code w/o data'
  )

  t.equal(
    m('``\nfoo\nbar  \nbaz\n``'),
    '<p><code>foo bar   baz</code></p>',
    'should support code w/o line endings (1)'
  )

  t.equal(
    m('``\nfoo \n``'),
    '<p><code>foo </code></p>',
    'should support code w/o line endings (2)'
  )

  t.equal(
    m('`foo   bar \nbaz`'),
    '<p><code>foo   bar  baz</code></p>',
    'should not support whitespace collapsing'
  )

  t.equal(
    m('`foo\\`bar`'),
    '<p><code>foo\\</code>bar`</p>',
    'should not support character escapes'
  )

  t.equal(
    m('``foo`bar``'),
    '<p><code>foo`bar</code></p>',
    'should support more accents'
  )

  t.equal(
    m('` foo `` bar `'),
    '<p><code>foo `` bar</code></p>',
    'should support less accents'
  )

  t.equal(
    m('*foo`*`'),
    '<p>*foo<code>*</code></p>',
    'should precede over emphasis'
  )

  t.equal(
    m('[not a `link](/foo`)'),
    '<p>[not a <code>link](/foo</code>)</p>',
    'should precede over links'
  )

  t.equal(
    m('`<a href="`">`'),
    '<p><code>&lt;a href=&quot;</code>&quot;&gt;`</p>',
    'should have same precedence as HTML (1)'
  )

  t.equal(
    m('<a href="`">`', {allowDangerousHtml: true}),
    '<p><a href="`">`</p>',
    'should have same precedence as HTML (2)'
  )

  t.equal(
    m('`<http://foo.bar.`baz>`'),
    '<p><code>&lt;http://foo.bar.</code>baz&gt;`</p>',
    'should have same precedence as autolinks (1)'
  )

  t.equal(
    m('<http://foo.bar.`baz>`'),
    '<p><a href="http://foo.bar.%60baz">http://foo.bar.`baz</a>`</p>',
    'should have same precedence as autolinks (2)'
  )

  t.equal(
    m('```foo``'),
    '<p>```foo``</p>',
    'should not support more accents before a fence'
  )

  t.equal(m('`foo'), '<p>`foo</p>', 'should not support no closing fence (1)')

  t.equal(
    m('`foo``bar``'),
    '<p>`foo<code>bar</code></p>',
    'should not support no closing fence (2)'
  )

  // Extra:
  t.equal(
    m('`foo\t\tbar`'),
    '<p><code>foo\t\tbar</code></p>',
    'should support tabs in code'
  )

  t.end()
})
