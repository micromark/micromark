import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('character-escape', async function (t) {
  await t.test('should support escaped ascii punctuation', async function () {
    assert.equal(
      micromark(
        '\\!\\"\\#\\$\\%\\&\\\'\\(\\)\\*\\+\\,\\-\\.\\/\\:\\;\\<\\=\\>\\?\\@\\[\\\\\\]\\^\\_\\`\\{\\|\\}\\~'
      ),
      "<p>!&quot;#$%&amp;'()*+,-./:;&lt;=&gt;?@[\\]^_`{|}~</p>"
    )
  })

  await t.test(
    'should not support other characters after a backslash',
    async function () {
      assert.equal(
        micromark('\\→\\A\\a\\ \\3\\φ\\«'),
        '<p>\\→\\A\\a\\ \\3\\φ\\«</p>'
      )
    }
  )

  await t.test('should escape other constructs', async function () {
    assert.equal(
      micromark(
        [
          '\\*not emphasized*',
          '\\<br/> not a tag',
          '\\[not a link](/foo)',
          '\\`not code`',
          '1\\. not a list',
          '\\* not a list',
          '\\# not a heading',
          '\\[foo]: /url "not a reference"',
          '\\&ouml; not a character entity'
        ].join('\n')
      ),
      [
        '<p>*not emphasized*',
        '&lt;br/&gt; not a tag',
        '[not a link](/foo)',
        '`not code`',
        '1. not a list',
        '* not a list',
        '# not a heading',
        '[foo]: /url &quot;not a reference&quot;',
        '&amp;ouml; not a character entity</p>'
      ].join('\n')
    )
  })

  await t.test('should escape a line break', async function () {
    assert.equal(micromark('foo\\\nbar'), '<p>foo<br />\nbar</p>')
  })

  await t.test('should not escape in text code', async function () {
    assert.equal(micromark('`` \\[\\` ``'), '<p><code>\\[\\`</code></p>')
  })

  await t.test('should not escape in indented code', async function () {
    assert.equal(micromark('    \\[\\]'), '<pre><code>\\[\\]\n</code></pre>')
  })

  await t.test('should not escape in autolink', async function () {
    assert.equal(
      micromark('<http://example.com?find=\\*>'),
      '<p><a href="http://example.com?find=%5C*">http://example.com?find=\\*</a></p>'
    )
  })

  await t.test('should not escape in flow html', async function () {
    assert.equal(
      micromark('<a href="/bar\\/)">', {allowDangerousHtml: true}),
      '<a href="/bar\\/)">'
    )
  })

  await t.test('should escape in resource and title', async function () {
    assert.equal(
      micromark('[foo](/bar\\* "ti\\*tle")'),
      '<p><a href="/bar*" title="ti*tle">foo</a></p>'
    )
  })

  await t.test(
    'should escape in definition resource and title',
    async function () {
      assert.equal(
        micromark('[foo]: /bar\\* "ti\\*tle"\n\n[foo]'),
        '<p><a href="/bar*" title="ti*tle">foo</a></p>'
      )
    }
  )

  await t.test('should escape in fenced code info', async function () {
    assert.equal(
      micromark('``` foo\\+bar\nfoo\n```'),
      '<pre><code class="language-foo+bar">foo\n</code></pre>'
    )
  })

  await t.test(
    'should support turning off character escapes',
    async function () {
      assert.equal(
        micromark('\\> a', {
          extensions: [{disable: {null: ['characterEscape']}}]
        }),
        '<p>\\&gt; a</p>'
      )
    }
  )
})
