import test from 'tape'
import {micromark} from 'micromark'

test('heading-atx', function (t) {
  t.equal(
    micromark('# foo'),
    '<h1>foo</h1>',
    'should support a heading w/ rank 1'
  )

  t.equal(
    micromark('## foo'),
    '<h2>foo</h2>',
    'should support a heading w/ rank 2'
  )

  t.equal(
    micromark('### foo'),
    '<h3>foo</h3>',
    'should support a heading w/ rank 3'
  )

  t.equal(
    micromark('#### foo'),
    '<h4>foo</h4>',
    'should support a heading w/ rank 4'
  )

  t.equal(
    micromark('##### foo'),
    '<h5>foo</h5>',
    'should support a heading w/ rank 5'
  )

  t.equal(
    micromark('###### foo'),
    '<h6>foo</h6>',
    'should support a heading w/ rank 6'
  )

  t.equal(
    micromark('####### foo'),
    '<p>####### foo</p>',
    'should not support a heading w/ rank 7'
  )

  t.equal(
    micromark('#5 bolt'),
    '<p>#5 bolt</p>',
    'should not support a heading for a number sign not followed by whitespace (1)'
  )

  t.equal(
    micromark('#hashtag'),
    '<p>#hashtag</p>',
    'should not support a heading for a number sign not followed by whitespace (2)'
  )

  t.equal(
    micromark('\\## foo'),
    '<p>## foo</p>',
    'should not support a heading for an escaped number sign'
  )

  t.equal(
    micromark('# foo *bar* \\*baz\\*'),
    '<h1>foo <em>bar</em> *baz*</h1>',
    'should support text content in headings'
  )

  t.equal(
    micromark('#                  foo                     '),
    '<h1>foo</h1>',
    'should support arbitrary initial and final whitespace'
  )

  t.equal(
    micromark(' ### foo'),
    '<h3>foo</h3>',
    'should support an initial space'
  )

  t.equal(
    micromark('  ## foo'),
    '<h2>foo</h2>',
    'should support two initial spaces'
  )

  t.equal(
    micromark('   # foo'),
    '<h1>foo</h1>',
    'should support three initial spaces'
  )

  t.equal(
    micromark('    # foo'),
    '<pre><code># foo\n</code></pre>',
    'should not support four initial spaces'
  )

  t.equal(
    micromark('foo\n    # bar'),
    '<p>foo\n# bar</p>',
    'should not support four initial spaces when interrupting'
  )

  t.equal(
    micromark('## foo ##'),
    '<h2>foo</h2>',
    'should support a closing sequence (1)'
  )

  t.equal(
    micromark('  ###   bar    ###'),
    '<h3>bar</h3>',
    'should support a closing sequence (2)'
  )

  t.equal(
    micromark('# foo ##################################'),
    '<h1>foo</h1>',
    'should support a closing sequence w/ an arbitrary number of number signs (1)'
  )

  t.equal(
    micromark('##### foo ##'),
    '<h5>foo</h5>',
    'should support a closing sequence w/ an arbitrary number of number signs (2)'
  )

  t.equal(
    micromark('### foo ###     '),
    '<h3>foo</h3>',
    'should support trailing whitespace after a closing sequence'
  )

  t.equal(
    micromark('### foo ### b'),
    '<h3>foo ### b</h3>',
    'should not support other content after a closing sequence'
  )

  t.equal(
    micromark('# foo#'),
    '<h1>foo#</h1>',
    'should not support a closing sequence w/o whitespace before it'
  )

  t.equal(
    micromark('### foo \\###'),
    '<h3>foo ###</h3>',
    'should not support an “escaped” closing sequence (1)'
  )

  t.equal(
    micromark('## foo #\\##'),
    '<h2>foo ###</h2>',
    'should not support an “escaped” closing sequence (2)'
  )

  t.equal(
    micromark('# foo \\#'),
    '<h1>foo #</h1>',
    'should not support an “escaped” closing sequence (3)'
  )

  t.equal(
    micromark('****\n## foo\n****'),
    '<hr />\n<h2>foo</h2>\n<hr />',
    'should support atx headings when not surrounded by blank lines'
  )

  t.equal(
    micromark('Foo bar\n# baz\nBar foo'),
    '<p>Foo bar</p>\n<h1>baz</h1>\n<p>Bar foo</p>',
    'should support atx headings interrupting paragraphs'
  )

  t.equal(
    micromark('## \n#\n### ###'),
    '<h2></h2>\n<h1></h1>\n<h3></h3>',
    'should support empty atx headings'
  )

  t.equal(
    micromark('# a', {extensions: [{disable: {null: ['headingAtx']}}]}),
    '<p># a</p>',
    'should support turning off heading (atx)'
  )

  t.end()
})
