import test from 'tape'
import m from '../../../index.js'

test('character-escape', function (t) {
  t.equal(
    m(
      '\\!\\"\\#\\$\\%\\&\\\'\\(\\)\\*\\+\\,\\-\\.\\/\\:\\;\\<\\=\\>\\?\\@\\[\\\\\\]\\^\\_\\`\\{\\|\\}\\~'
    ),
    "<p>!&quot;#$%&amp;'()*+,-./:;&lt;=&gt;?@[\\]^_`{|}~</p>",
    'should support escaped ascii punctuation'
  )

  t.equal(
    m('\\→\\A\\a\\ \\3\\φ\\«'),
    '<p>\\→\\A\\a\\ \\3\\φ\\«</p>',
    'should not support other characters after a backslash'
  )

  t.equal(
    m(
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
    ].join('\n'),
    'should escape other constructs'
  )

  t.equal(
    m('foo\\\nbar'),
    '<p>foo<br />\nbar</p>',
    'should escape a line break'
  )

  t.equal(
    m('`` \\[\\` ``'),
    '<p><code>\\[\\`</code></p>',
    'should not escape in text code'
  )

  t.equal(
    m('    \\[\\]'),
    '<pre><code>\\[\\]\n</code></pre>',
    'should not escape in indented code'
  )

  t.equal(
    m('<http://example.com?find=\\*>'),
    '<p><a href="http://example.com?find=%5C*">http://example.com?find=\\*</a></p>',
    'should not escape in autolink'
  )

  t.equal(
    m('<a href="/bar\\/)">', {allowDangerousHtml: true}),
    '<a href="/bar\\/)">',
    'should not escape in flow html'
  )

  t.equal(
    m('[foo](/bar\\* "ti\\*tle")'),
    '<p><a href="/bar*" title="ti*tle">foo</a></p>',
    'should escape in resource and title'
  )

  t.equal(
    m('[foo]: /bar\\* "ti\\*tle"\n\n[foo]'),
    '<p><a href="/bar*" title="ti*tle">foo</a></p>',
    'should escape in definition resource and title'
  )

  t.equal(
    m('``` foo\\+bar\nfoo\n```'),
    '<pre><code class="language-foo+bar">foo\n</code></pre>',
    'should escape in fenced code info'
  )

  t.end()
})
