'use strict'

var test = require('tape')
var m = require('../../..')

test('thematic-break', function (t) {
  t.equal(
    m('***\n---\n___'),
    '<hr />\n<hr />\n<hr />',
    'should support thematic breaks w/ asterisks, dashes, and underscores'
  )

  t.equal(
    m('+++'),
    '<p>+++</p>',
    'should not support thematic breaks w/ plusses'
  )

  t.equal(
    m('==='),
    '<p>===</p>',
    'should not support thematic breaks w/ equals'
  )

  t.equal(
    m('--'),
    '<p>--</p>',
    'should not support thematic breaks w/ two dashes'
  )

  t.equal(
    m('**'),
    '<p>**</p>',
    'should not support thematic breaks w/ two asterisks'
  )

  t.equal(
    m('__'),
    '<p>__</p>',
    'should not support thematic breaks w/ two underscores'
  )

  t.equal(m(' ***'), '<hr />', 'should support thematic breaks w/ a space')

  t.equal(m('  ***'), '<hr />', 'should support thematic breaks w/ two spaces')

  t.equal(
    m('   ***'),
    '<hr />',
    'should support thematic breaks w/ three spaces'
  )

  // t.equal(
  //   m('    ***'),
  //   '<pre><code>***\n</code></pre>',
  //   'should not support thematic breaks w/ four spaces'
  // )

  // t.equal(
  //   m('Foo\n    ***'),
  //   '<p>Foo\n***</p>',
  //   'should not support thematic breaks w/ four spaces as paragraph continuation'
  // )

  t.equal(
    m('_____________________________________'),
    '<hr />',
    'should support thematic breaks w/ many markers'
  )

  t.equal(m(' - - -'), '<hr />', 'should support thematic breaks w/ spaces (1)')

  t.equal(
    m(' **  * ** * ** * **'),
    '<hr />',
    'should support thematic breaks w/ spaces (2)'
  )

  t.equal(
    m('-     -      -      -'),
    '<hr />',
    'should support thematic breaks w/ spaces (3)'
  )

  t.equal(
    m('- - - -    '),
    '<hr />',
    'should support thematic breaks w/ trailing spaces'
  )

  t.equal(
    m('_ _ _ _ a'),
    '<p>_ _ _ _ a</p>',
    'should not support thematic breaks w/ other characters (1)'
  )

  t.equal(
    m('a------'),
    '<p>a------</p>',
    'should not support thematic breaks w/ other characters (2)'
  )

  t.equal(
    m('---a---'),
    '<p>---a---</p>',
    'should not support thematic breaks w/ other characters (3)'
  )

  t.equal(
    m(' *-*'),
    '<p><em>-</em></p>',
    'should not support thematic breaks w/ mixed markers'
  )

  // t.equal(
  //   m('- foo\n***\n- bar'),
  //   '<ul>\n<li>foo</li>\n</ul>\n<hr />\n<ul>\n<li>bar</li>\n</ul>',
  //   'should support thematic breaks mixed w/ lists (1)'
  // )

  // t.equal(
  //   m('* Foo\n* * *\n* Bar'),
  //   '<ul>\n<li>Foo</li>\n</ul>\n<hr />\n<ul>\n<li>Bar</li>\n</ul>',
  //   'should support thematic breaks mixed w/ lists (2)'
  // )

  // t.equal(
  //   m('Foo\n***\nbar'),
  //   '<p>Foo</p>\n<hr />\n<p>bar</p>',
  //   'should support thematic breaks interrupting paragraphs'
  // )

  // t.equal(
  //   m('Foo\n---\nbar'),
  //   '<h2>Foo</h2>\n<p>bar</p>',
  //   'should not support thematic breaks w/ dashes interrupting paragraphs (setext heading)'
  // )

  // t.equal(
  //   m('- Foo\n- * * *'),
  //   '<ul>\n<li>Foo</li>\n<li>\n<hr />\n</li>\n</ul>',
  //   'should support thematic breaks in lists'
  // )

  t.end()
})
