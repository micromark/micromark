import test from 'tape'
import {buffer as micromark} from '../../../lib/micromark/index.js'

test('thematic-break', function (t) {
  t.equal(
    micromark('***\n---\n___'),
    '<hr />\n<hr />\n<hr />',
    'should support thematic breaks w/ asterisks, dashes, and underscores'
  )

  t.equal(
    micromark('+++'),
    '<p>+++</p>',
    'should not support thematic breaks w/ plusses'
  )

  t.equal(
    micromark('==='),
    '<p>===</p>',
    'should not support thematic breaks w/ equals'
  )

  t.equal(
    micromark('--'),
    '<p>--</p>',
    'should not support thematic breaks w/ two dashes'
  )

  t.equal(
    micromark('**'),
    '<p>**</p>',
    'should not support thematic breaks w/ two asterisks'
  )

  t.equal(
    micromark('__'),
    '<p>__</p>',
    'should not support thematic breaks w/ two underscores'
  )

  t.equal(
    micromark(' ***'),
    '<hr />',
    'should support thematic breaks w/ 1 space'
  )

  t.equal(
    micromark('  ***'),
    '<hr />',
    'should support thematic breaks w/ 2 spaces'
  )

  t.equal(
    micromark('   ***'),
    '<hr />',
    'should support thematic breaks w/ 3 spaces'
  )

  t.equal(
    micromark('    ***'),
    '<pre><code>***\n</code></pre>',
    'should not support thematic breaks w/ 4 spaces'
  )

  t.equal(
    micromark('Foo\n    ***'),
    '<p>Foo\n***</p>',
    'should not support thematic breaks w/ 4 spaces as paragraph continuation'
  )

  t.equal(
    micromark('_____________________________________'),
    '<hr />',
    'should support thematic breaks w/ many markers'
  )

  t.equal(
    micromark(' - - -'),
    '<hr />',
    'should support thematic breaks w/ spaces (1)'
  )

  t.equal(
    micromark(' **  * ** * ** * **'),
    '<hr />',
    'should support thematic breaks w/ spaces (2)'
  )

  t.equal(
    micromark('-     -      -      -'),
    '<hr />',
    'should support thematic breaks w/ spaces (3)'
  )

  t.equal(
    micromark('- - - -    '),
    '<hr />',
    'should support thematic breaks w/ trailing spaces'
  )

  t.equal(
    micromark('_ _ _ _ a'),
    '<p>_ _ _ _ a</p>',
    'should not support thematic breaks w/ other characters (1)'
  )

  t.equal(
    micromark('a------'),
    '<p>a------</p>',
    'should not support thematic breaks w/ other characters (2)'
  )

  t.equal(
    micromark('---a---'),
    '<p>---a---</p>',
    'should not support thematic breaks w/ other characters (3)'
  )

  t.equal(
    micromark(' *-*'),
    '<p><em>-</em></p>',
    'should not support thematic breaks w/ mixed markers'
  )

  t.equal(
    micromark('- foo\n***\n- bar'),
    '<ul>\n<li>foo</li>\n</ul>\n<hr />\n<ul>\n<li>bar</li>\n</ul>',
    'should support thematic breaks mixed w/ lists (1)'
  )

  t.equal(
    micromark('* Foo\n* * *\n* Bar'),
    '<ul>\n<li>Foo</li>\n</ul>\n<hr />\n<ul>\n<li>Bar</li>\n</ul>',
    'should support thematic breaks mixed w/ lists (2)'
  )

  t.equal(
    micromark('Foo\n***\nbar'),
    '<p>Foo</p>\n<hr />\n<p>bar</p>',
    'should support thematic breaks interrupting paragraphs'
  )

  t.equal(
    micromark('Foo\n---\nbar'),
    '<h2>Foo</h2>\n<p>bar</p>',
    'should not support thematic breaks w/ dashes interrupting paragraphs (setext heading)'
  )

  t.equal(
    micromark('- Foo\n- * * *'),
    '<ul>\n<li>Foo</li>\n<li>\n<hr />\n</li>\n</ul>',
    'should support thematic breaks in lists'
  )

  t.equal(
    micromark('***', {extensions: [{disable: {null: ['thematicBreak']}}]}),
    '<p>***</p>',
    'should support turning off thematic breaks'
  )

  t.end()
})
