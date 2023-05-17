import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('thematic-break', function () {
  assert.equal(
    micromark('***\n---\n___'),
    '<hr />\n<hr />\n<hr />',
    'should support thematic breaks w/ asterisks, dashes, and underscores'
  )

  assert.equal(
    micromark('+++'),
    '<p>+++</p>',
    'should not support thematic breaks w/ plusses'
  )

  assert.equal(
    micromark('==='),
    '<p>===</p>',
    'should not support thematic breaks w/ equals'
  )

  assert.equal(
    micromark('--'),
    '<p>--</p>',
    'should not support thematic breaks w/ two dashes'
  )

  assert.equal(
    micromark('**'),
    '<p>**</p>',
    'should not support thematic breaks w/ two asterisks'
  )

  assert.equal(
    micromark('__'),
    '<p>__</p>',
    'should not support thematic breaks w/ two underscores'
  )

  assert.equal(
    micromark(' ***'),
    '<hr />',
    'should support thematic breaks w/ 1 space'
  )

  assert.equal(
    micromark('  ***'),
    '<hr />',
    'should support thematic breaks w/ 2 spaces'
  )

  assert.equal(
    micromark('   ***'),
    '<hr />',
    'should support thematic breaks w/ 3 spaces'
  )

  assert.equal(
    micromark('    ***'),
    '<pre><code>***\n</code></pre>',
    'should not support thematic breaks w/ 4 spaces'
  )

  assert.equal(
    micromark('Foo\n    ***'),
    '<p>Foo\n***</p>',
    'should not support thematic breaks w/ 4 spaces as paragraph continuation'
  )

  assert.equal(
    micromark('_____________________________________'),
    '<hr />',
    'should support thematic breaks w/ many markers'
  )

  assert.equal(
    micromark(' - - -'),
    '<hr />',
    'should support thematic breaks w/ spaces (1)'
  )

  assert.equal(
    micromark(' **  * ** * ** * **'),
    '<hr />',
    'should support thematic breaks w/ spaces (2)'
  )

  assert.equal(
    micromark('-     -      -      -'),
    '<hr />',
    'should support thematic breaks w/ spaces (3)'
  )

  assert.equal(
    micromark('- - - -    '),
    '<hr />',
    'should support thematic breaks w/ trailing spaces'
  )

  assert.equal(
    micromark('_ _ _ _ a'),
    '<p>_ _ _ _ a</p>',
    'should not support thematic breaks w/ other characters (1)'
  )

  assert.equal(
    micromark('a------'),
    '<p>a------</p>',
    'should not support thematic breaks w/ other characters (2)'
  )

  assert.equal(
    micromark('---a---'),
    '<p>---a---</p>',
    'should not support thematic breaks w/ other characters (3)'
  )

  assert.equal(
    micromark(' *-*'),
    '<p><em>-</em></p>',
    'should not support thematic breaks w/ mixed markers'
  )

  assert.equal(
    micromark('- foo\n***\n- bar'),
    '<ul>\n<li>foo</li>\n</ul>\n<hr />\n<ul>\n<li>bar</li>\n</ul>',
    'should support thematic breaks mixed w/ lists (1)'
  )

  assert.equal(
    micromark('* Foo\n* * *\n* Bar'),
    '<ul>\n<li>Foo</li>\n</ul>\n<hr />\n<ul>\n<li>Bar</li>\n</ul>',
    'should support thematic breaks mixed w/ lists (2)'
  )

  assert.equal(
    micromark('Foo\n***\nbar'),
    '<p>Foo</p>\n<hr />\n<p>bar</p>',
    'should support thematic breaks interrupting paragraphs'
  )

  assert.equal(
    micromark('Foo\n---\nbar'),
    '<h2>Foo</h2>\n<p>bar</p>',
    'should not support thematic breaks w/ dashes interrupting paragraphs (setext heading)'
  )

  assert.equal(
    micromark('- Foo\n- * * *'),
    '<ul>\n<li>Foo</li>\n<li>\n<hr />\n</li>\n</ul>',
    'should support thematic breaks in lists'
  )

  assert.equal(
    micromark('> ---\na'),
    '<blockquote>\n<hr />\n</blockquote>\n<p>a</p>',
    'should not support lazyness (1)'
  )

  assert.equal(
    micromark('> a\n---'),
    '<blockquote>\n<p>a</p>\n</blockquote>\n<hr />',
    'should not support lazyness (2)'
  )

  assert.equal(
    micromark('***', {extensions: [{disable: {null: ['thematicBreak']}}]}),
    '<p>***</p>',
    'should support turning off thematic breaks'
  )
})
