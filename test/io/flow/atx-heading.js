'use strict'

var test = require('tape')
var m = require('../../..')

test('atx-heading', function (t) {
  t.equal(
    m('# foo'),
    '<h1>foo</h1>',
    'should support a heading with a rank of 1'
  )

  t.equal(
    m('## foo'),
    '<h2>foo</h2>',
    'should support a heading with a rank of 2'
  )

  t.equal(
    m('### foo'),
    '<h3>foo</h3>',
    'should support a heading with a rank of 3'
  )

  t.equal(
    m('#### foo'),
    '<h4>foo</h4>',
    'should support a heading with a rank of 4'
  )

  t.equal(
    m('##### foo'),
    '<h5>foo</h5>',
    'should support a heading with a rank of 5'
  )

  t.equal(
    m('###### foo'),
    '<h6>foo</h6>',
    'should support a heading with a rank of 6'
  )

  t.equal(
    m('####### foo'),
    '<p>####### foo</p>',
    'should not support a heading with a rank of 7'
  )

  t.equal(
    m('#5 bolt'),
    '<p>#5 bolt</p>',
    'should not support a heading with not followed by whitespace (1)'
  )

  t.equal(
    m('#hashtag'),
    '<p>#hashtag</p>',
    'should not support a heading with not followed by whitespace (2)'
  )

  t.equal(
    m('\\## foo'),
    '<p>## foo</p>',
    'should not support a heading that starts with an escape'
  )

  t.equal(
    m('# foo *bar* \\*baz\\*'),
    '<h1>foo <em>bar</em> *baz*</h1>',
    'should support content'
  )

  t.equal(
    m('#                  foo                     '),
    '<h1>foo</h1>',
    'should support arbitrary initial and final whitespace'
  )

  t.equal(m(' ### foo'), '<h3>foo</h3>', 'should support an initial space')

  t.equal(m('  ## foo'), '<h2>foo</h2>', 'should support two initial spaces')

  t.equal(m('   # foo'), '<h1>foo</h1>', 'should support three initial spaces')

  t.equal(
    m('    # foo'),
    '<pre><code># foo\n</code></pre>',
    'should not support four initial spaces (1)'
  )

  t.equal(
    m('foo\n    # bar'),
    '<p>foo\n# bar</p>',
    'should not support four initial spaces (2)'
  )

  t.equal(
    m('## foo ##'),
    '<h2>foo</h2>',
    'should support a closing sequence (1)'
  )

  t.equal(
    m('  ###   bar    ###'),
    '<h3>bar</h3>',
    'should support a closing sequence (2)'
  )

  t.equal(
    m('# foo ##################################'),
    '<h1>foo</h1>',
    'should support a closing sequence (3)'
  )

  t.equal(
    m('##### foo ##'),
    '<h5>foo</h5>',
    'should support a closing sequence (4)'
  )

  t.equal(
    m('### foo ###     '),
    '<h3>foo</h3>',
    'should support a trailing whitespace after a closing sequence'
  )

  t.equal(
    m('### foo ### b'),
    '<h3>foo ### b</h3>',
    'should not support other content after a closing sequence'
  )

  t.equal(
    m('# foo#'),
    '<h1>foo#</h1>',
    'should not support a closing sequence without whitespace before it'
  )

  t.equal(
    m('### foo \\###'),
    '<h3>foo ###</h3>',
    'should not support a character escaped closing sequence (1)'
  )

  t.equal(
    m('## foo #\\##'),
    '<h2>foo ###</h2>',
    'should not support a character escaped closing sequence (2)'
  )

  t.equal(
    m('# foo \\#'),
    '<h1>foo #</h1>',
    'should not support a character escaped closing sequence (3)'
  )

  t.equal(
    m('****\n## foo\n****'),
    '<hr />\n<h2>foo</h2>\n<hr />',
    'should support atx headings when not surrounded by blank lines'
  )

  // t.equal(
  //   m('Foo bar\n# baz\nBar foo'),
  //   '<p>Foo bar</p>\n<h1>baz</h1>\n<p>Bar foo</p>',
  //   'should support atx headings when interrupting paragraphs'
  // )

  t.equal(
    m('## \n#\n### ###'),
    '<h2></h2>\n<h1></h1>\n<h3></h3>',
    'should support empty atx headings'
  )

  t.end()
})
