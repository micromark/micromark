import test from 'tape'
import m from '../../../index.js'

test('emphasis', function (t) {
  // Rule 1.
  t.equal(
    m('*foo bar*'),
    '<p><em>foo bar</em></p>',
    'should support emphasis w/ `*`'
  )

  t.equal(
    m('a * foo bar*'),
    '<p>a * foo bar*</p>',
    'should not support emphasis if the opening is not left flanking (1)'
  )

  t.equal(
    m('a*"foo"*'),
    '<p>a*&quot;foo&quot;*</p>',
    'should not support emphasis if the opening is not left flanking (2b)'
  )

  t.equal(
    m('* a *'),
    '<p>* a *</p>',
    'should not support emphasis unicode whitespace either'
  )

  t.equal(
    m('foo*bar*'),
    '<p>foo<em>bar</em></p>',
    'should support intraword emphasis w/ `*` (1)'
  )

  t.equal(
    m('5*6*78'),
    '<p>5<em>6</em>78</p>',
    'should support intraword emphasis w/ `*` (2)'
  )

  // Rule 2.
  t.equal(
    m('_foo bar_'),
    '<p><em>foo bar</em></p>',
    'should support emphasis w/ `_`'
  )

  t.equal(
    m('_ foo bar_'),
    '<p>_ foo bar_</p>',
    'should not support emphasis if the opening is followed by whitespace'
  )

  t.equal(
    m('a_"foo"_'),
    '<p>a_&quot;foo&quot;_</p>',
    'should not support emphasis if the opening is preceded by something else and followed by punctuation'
  )

  t.equal(
    m('foo_bar_'),
    '<p>foo_bar_</p>',
    'should not support intraword emphasis (1)'
  )

  t.equal(
    m('5_6_78'),
    '<p>5_6_78</p>',
    'should not support intraword emphasis (2)'
  )

  t.equal(
    m('пристаням_стремятся_'),
    '<p>пристаням_стремятся_</p>',
    'should not support intraword emphasis (3)'
  )

  t.equal(
    m('aa_"bb"_cc'),
    '<p>aa_&quot;bb&quot;_cc</p>',
    'should not support emphasis if the opening is right flanking and the closing is left flanking'
  )

  t.equal(
    m('foo-_(bar)_'),
    '<p>foo-<em>(bar)</em></p>',
    'should support emphasis if the opening is both left and right flanking, if it’s preceded by punctuation'
  )

  // Rule 3.
  t.equal(
    m('_foo*'),
    '<p>_foo*</p>',
    'should not support emphasis if opening and closing markers don’t match'
  )

  t.equal(
    m('*foo bar *'),
    '<p>*foo bar *</p>',
    'should not support emphasis w/ `*` if the closing markers are preceded by whitespace'
  )

  t.equal(
    m('*foo bar\n*'),
    '<p>*foo bar\n*</p>',
    'should not support emphasis w/ `*` if the closing markers are preceded by a line break (also whitespace)'
  )

  t.equal(
    m('*(*foo)'),
    '<p>*(*foo)</p>',
    'should not support emphasis w/ `*` if the closing markers are not right flanking'
  )

  t.equal(
    m('*(*foo*)*'),
    '<p><em>(<em>foo</em>)</em></p>',
    'should support nested emphasis'
  )

  // Rule 4.

  t.equal(
    m('_foo bar _'),
    '<p>_foo bar _</p>',
    'should not support emphasis if the closing `_` is preceded by whitespace'
  )

  t.equal(
    m('_(_foo)'),
    '<p>_(_foo)</p>',
    'should not support emphasis w/ `_` if the closing markers are not right flanking'
  )

  t.equal(
    m('_(_foo_)_'),
    '<p><em>(<em>foo</em>)</em></p>',
    'should support nested emphasis w/ `_`'
  )

  t.equal(
    m('_foo_bar'),
    '<p>_foo_bar</p>',
    'should not support intraword emphasis w/ `_` (1)'
  )

  t.equal(
    m('_пристаням_стремятся'),
    '<p>_пристаням_стремятся</p>',
    'should not support intraword emphasis w/ `_` (2)'
  )

  t.equal(
    m('_foo_bar_baz_'),
    '<p><em>foo_bar_baz</em></p>',
    'should not support intraword emphasis w/ `_` (3)'
  )

  t.equal(
    m('_(bar)_.'),
    '<p><em>(bar)</em>.</p>',
    'should support emphasis if the opening is both left and right flanking, if it’s followed by punctuation'
  )

  // Rule 5.
  t.equal(
    m('**foo bar**'),
    '<p><strong>foo bar</strong></p>',
    'should support strong emphasis'
  )

  t.equal(
    m('** foo bar**'),
    '<p>** foo bar**</p>',
    'should not support strong emphasis if the opening is followed by whitespace'
  )

  t.equal(
    m('a**"foo"**'),
    '<p>a**&quot;foo&quot;**</p>',
    'should not support strong emphasis if the opening is preceded by something else and followed by punctuation'
  )

  t.equal(
    m('foo**bar**'),
    '<p>foo<strong>bar</strong></p>',
    'should support strong intraword emphasis'
  )

  // Rule 6.
  t.equal(
    m('__foo bar__'),
    '<p><strong>foo bar</strong></p>',
    'should support strong emphasis w/ `_`'
  )

  t.equal(
    m('__ foo bar__'),
    '<p>__ foo bar__</p>',
    'should not support strong emphasis if the opening is followed by whitespace'
  )

  t.equal(
    m('__\nfoo bar__'),
    '<p>__\nfoo bar__</p>',
    'should not support strong emphasis if the opening is followed by a line ending (also whitespace)'
  )

  t.equal(
    m('a__"foo"__'),
    '<p>a__&quot;foo&quot;__</p>',
    'should not support strong emphasis if the opening is preceded by something else and followed by punctuation'
  )

  t.equal(
    m('foo__bar__'),
    '<p>foo__bar__</p>',
    'should not support strong intraword emphasis w/ `_` (1)'
  )

  t.equal(
    m('5__6__78'),
    '<p>5__6__78</p>',
    'should not support strong intraword emphasis w/ `_` (2)'
  )

  t.equal(
    m('пристаням__стремятся__'),
    '<p>пристаням__стремятся__</p>',
    'should not support strong intraword emphasis w/ `_` (3)'
  )

  t.equal(
    m('__foo, __bar__, baz__'),
    '<p><strong>foo, <strong>bar</strong>, baz</strong></p>',
    'should support nested strong emphasis'
  )

  t.equal(
    m('foo-__(bar)__'),
    '<p>foo-<strong>(bar)</strong></p>',
    'should support strong emphasis if the opening is both left and right flanking, if it’s preceded by punctuation'
  )

  // Rule 7.
  t.equal(
    m('**foo bar **'),
    '<p>**foo bar **</p>',
    'should not support strong emphasis w/ `*` if the closing is preceded by whitespace'
  )

  t.equal(
    m('**(**foo)'),
    '<p>**(**foo)</p>',
    'should not support strong emphasis w/ `*` if the closing is preceded by punctuation and followed by something else'
  )

  t.equal(
    m('*(**foo**)*'),
    '<p><em>(<strong>foo</strong>)</em></p>',
    'should support strong emphasis in emphasis'
  )

  t.equal(
    m(
      '**Gomphocarpus (*Gomphocarpus physocarpus*, syn.\n*Asclepias physocarpa*)**'
    ),
    '<p><strong>Gomphocarpus (<em>Gomphocarpus physocarpus</em>, syn.\n<em>Asclepias physocarpa</em>)</strong></p>',
    'should support emphasis in strong emphasis (1)'
  )

  t.equal(
    m('**foo "*bar*" foo**'),
    '<p><strong>foo &quot;<em>bar</em>&quot; foo</strong></p>',
    'should support emphasis in strong emphasis (2)'
  )

  t.equal(
    m('**foo**bar'),
    '<p><strong>foo</strong>bar</p>',
    'should support strong intraword emphasis'
  )

  // Rule 8.
  t.equal(
    m('__foo bar __'),
    '<p>__foo bar __</p>',
    'should not support strong emphasis w/ `_` if the closing is preceded by whitespace'
  )

  t.equal(
    m('__(__foo)'),
    '<p>__(__foo)</p>',
    'should not support strong emphasis w/ `_` if the closing is preceded by punctuation and followed by something else'
  )

  t.equal(
    m('_(__foo__)_'),
    '<p><em>(<strong>foo</strong>)</em></p>',
    'should support strong emphasis w/ `_` in emphasis'
  )

  t.equal(
    m('__foo__bar'),
    '<p>__foo__bar</p>',
    'should not support strong intraword emphasis w/ `_` (1)'
  )

  t.equal(
    m('__пристаням__стремятся'),
    '<p>__пристаням__стремятся</p>',
    'should not support strong intraword emphasis w/ `_` (2)'
  )

  t.equal(
    m('__foo__bar__baz__'),
    '<p><strong>foo__bar__baz</strong></p>',
    'should not support strong intraword emphasis w/ `_` (3)'
  )

  t.equal(
    m('__(bar)__.'),
    '<p><strong>(bar)</strong>.</p>',
    'should support strong emphasis if the opening is both left and right flanking, if it’s followed by punctuation'
  )

  // Rule 9.
  t.equal(
    m('*foo [bar](/url)*'),
    '<p><em>foo <a href="/url">bar</a></em></p>',
    'should support content in emphasis'
  )

  t.equal(
    m('*foo\nbar*'),
    '<p><em>foo\nbar</em></p>',
    'should support line endings in emphasis'
  )

  t.equal(
    m('_foo __bar__ baz_'),
    '<p><em>foo <strong>bar</strong> baz</em></p>',
    'should support nesting emphasis and strong (1)'
  )

  t.equal(
    m('_foo _bar_ baz_'),
    '<p><em>foo <em>bar</em> baz</em></p>',
    'should support nesting emphasis and strong (2)'
  )

  t.equal(
    m('__foo_ bar_'),
    '<p><em><em>foo</em> bar</em></p>',
    'should support nesting emphasis and strong (3)'
  )

  t.equal(
    m('*foo *bar**'),
    '<p><em>foo <em>bar</em></em></p>',
    'should support nesting emphasis and strong (4)'
  )

  t.equal(
    m('*foo **bar** baz*'),
    '<p><em>foo <strong>bar</strong> baz</em></p>',
    'should support nesting emphasis and strong (5)'
  )

  t.equal(
    m('*foo**bar**baz*'),
    '<p><em>foo<strong>bar</strong>baz</em></p>',
    'should support nesting emphasis and strong (6)'
  )

  t.equal(
    m('*foo**bar*'),
    '<p><em>foo**bar</em></p>',
    'should not support adjacent emphasis in certain cases'
  )

  t.equal(
    m('***foo** bar*'),
    '<p><em><strong>foo</strong> bar</em></p>',
    'complex (1)'
  )
  t.equal(
    m('*foo **bar***'),
    '<p><em>foo <strong>bar</strong></em></p>',
    'complex (2)'
  )
  t.equal(
    m('*foo**bar***'),
    '<p><em>foo<strong>bar</strong></em></p>',
    'complex (3)'
  )

  t.equal(
    m('foo***bar***baz'),
    '<p>foo<em><strong>bar</strong></em>baz</p>',
    'complex (a)'
  )
  t.equal(
    m('foo******bar*********baz'),
    '<p>foo<strong><strong><strong>bar</strong></strong></strong>***baz</p>',
    'complex (b)'
  )

  t.equal(
    m('*foo **bar *baz* bim** bop*'),
    '<p><em>foo <strong>bar <em>baz</em> bim</strong> bop</em></p>',
    'should support indefinite nesting of emphasis (1)'
  )

  t.equal(
    m('*foo [*bar*](/url)*'),
    '<p><em>foo <a href="/url"><em>bar</em></a></em></p>',
    'should support indefinite nesting of emphasis (2)'
  )

  t.equal(
    m('** is not an empty emphasis'),
    '<p>** is not an empty emphasis</p>',
    'should not support empty emphasis'
  )

  t.equal(
    m('**** is not an empty emphasis'),
    '<p>**** is not an empty emphasis</p>',
    'should not support empty strong emphasis'
  )

  // Rule 10.
  t.equal(
    m('**foo [bar](/url)**'),
    '<p><strong>foo <a href="/url">bar</a></strong></p>',
    'should support content in strong emphasis'
  )

  t.equal(
    m('**foo\nbar**'),
    '<p><strong>foo\nbar</strong></p>',
    'should support line endings in emphasis'
  )

  t.equal(
    m('__foo _bar_ baz__'),
    '<p><strong>foo <em>bar</em> baz</strong></p>',
    'should support nesting emphasis and strong (1)'
  )

  t.equal(
    m('__foo __bar__ baz__'),
    '<p><strong>foo <strong>bar</strong> baz</strong></p>',
    'should support nesting emphasis and strong (2)'
  )

  t.equal(
    m('____foo__ bar__'),
    '<p><strong><strong>foo</strong> bar</strong></p>',
    'should support nesting emphasis and strong (3)'
  )

  t.equal(
    m('**foo **bar****'),
    '<p><strong>foo <strong>bar</strong></strong></p>',
    'should support nesting emphasis and strong (4)'
  )

  t.equal(
    m('**foo *bar* baz**'),
    '<p><strong>foo <em>bar</em> baz</strong></p>',
    'should support nesting emphasis and strong (5)'
  )

  t.equal(
    m('**foo*bar*baz**'),
    '<p><strong>foo<em>bar</em>baz</strong></p>',
    'should support nesting emphasis and strong (6)'
  )

  t.equal(
    m('***foo* bar**'),
    '<p><strong><em>foo</em> bar</strong></p>',
    'should support nesting emphasis and strong (7)'
  )

  t.equal(
    m('**foo *bar***'),
    '<p><strong>foo <em>bar</em></strong></p>',
    'should support nesting emphasis and strong (8)'
  )

  t.equal(
    m('**foo *bar **baz**\nbim* bop**'),
    '<p><strong>foo <em>bar <strong>baz</strong>\nbim</em> bop</strong></p>',
    'should support indefinite nesting of emphasis (1)'
  )

  t.equal(
    m('**foo [*bar*](/url)**'),
    '<p><strong>foo <a href="/url"><em>bar</em></a></strong></p>',
    'should support indefinite nesting of emphasis (2)'
  )

  t.equal(
    m('__ is not an empty emphasis'),
    '<p>__ is not an empty emphasis</p>',
    'should not support empty emphasis'
  )

  t.equal(
    m('____ is not an empty emphasis'),
    '<p>____ is not an empty emphasis</p>',
    'should not support empty strong emphasis'
  )

  // Rule 11.
  t.equal(
    m('foo ***'),
    '<p>foo ***</p>',
    'should not support emphasis around the same marker'
  )

  t.equal(
    m('foo *\\**'),
    '<p>foo <em>*</em></p>',
    'should support emphasis around an escaped marker'
  )

  t.equal(
    m('foo *_*'),
    '<p>foo <em>_</em></p>',
    'should support emphasis around the other marker'
  )

  t.equal(
    m('foo *****'),
    '<p>foo *****</p>',
    'should not support strong emphasis around the same marker'
  )

  t.equal(
    m('foo **\\***'),
    '<p>foo <strong>*</strong></p>',
    'should support strong emphasis around an escaped marker'
  )

  t.equal(
    m('foo **_**'),
    '<p>foo <strong>_</strong></p>',
    'should support strong emphasis around the other marker'
  )

  t.equal(
    m('**foo*'),
    '<p>*<em>foo</em></p>',
    'should support a superfluous marker at the start of emphasis'
  )

  t.equal(
    m('*foo**'),
    '<p><em>foo</em>*</p>',
    'should support a superfluous marker at the end of emphasis'
  )

  t.equal(
    m('***foo**'),
    '<p>*<strong>foo</strong></p>',
    'should support a superfluous marker at the start of strong'
  )

  t.equal(
    m('****foo*'),
    '<p>***<em>foo</em></p>',
    'should support multiple superfluous markers at the start of strong'
  )

  t.equal(
    m('**foo***'),
    '<p><strong>foo</strong>*</p>',
    'should support a superfluous marker at the end of strong'
  )

  t.equal(
    m('*foo****'),
    '<p><em>foo</em>***</p>',
    'should support multiple superfluous markers at the end of strong'
  )

  // Rule 12.
  t.equal(
    m('foo ___'),
    '<p>foo ___</p>',
    'should not support emphasis around the same marker'
  )

  t.equal(
    m('foo _\\__'),
    '<p>foo <em>_</em></p>',
    'should support emphasis around an escaped marker'
  )

  t.equal(
    m('foo _X_'),
    '<p>foo <em>X</em></p>',
    'should support emphasis around the other marker'
  )

  t.equal(
    m('foo _____'),
    '<p>foo _____</p>',
    'should not support strong emphasis around the same marker'
  )

  t.equal(
    m('foo __\\___'),
    '<p>foo <strong>_</strong></p>',
    'should support strong emphasis around an escaped marker'
  )

  t.equal(
    m('foo __X__'),
    '<p>foo <strong>X</strong></p>',
    'should support strong emphasis around the other marker'
  )

  t.equal(
    m('__foo_'),
    '<p>_<em>foo</em></p>',
    'should support a superfluous marker at the start of emphasis'
  )

  t.equal(
    m('_foo__'),
    '<p><em>foo</em>_</p>',
    'should support a superfluous marker at the end of emphasis'
  )

  t.equal(
    m('___foo__'),
    '<p>_<strong>foo</strong></p>',
    'should support a superfluous marker at the start of strong'
  )

  t.equal(
    m('____foo_'),
    '<p>___<em>foo</em></p>',
    'should support multiple superfluous markers at the start of strong'
  )

  t.equal(
    m('__foo___'),
    '<p><strong>foo</strong>_</p>',
    'should support a superfluous marker at the end of strong'
  )

  t.equal(
    m('_foo____'),
    '<p><em>foo</em>___</p>',
    'should support multiple superfluous markers at the end of strong'
  )

  // Rule 13.
  t.equal(
    m('**foo**'),
    '<p><strong>foo</strong></p>',
    'should support strong w/ `*`'
  )

  t.equal(
    m('*_foo_*'),
    '<p><em><em>foo</em></em></p>',
    'should support emphasis directly in emphasis w/ `_` in `*`'
  )

  t.equal(
    m('__foo__'),
    '<p><strong>foo</strong></p>',
    'should support strong w/ `_`'
  )

  t.equal(
    m('_*foo*_'),
    '<p><em><em>foo</em></em></p>',
    'should support emphasis directly in emphasis w/ `*` in `_`'
  )

  t.equal(
    m('****foo****'),
    '<p><strong><strong>foo</strong></strong></p>',
    'should support strong emphasis directly in strong emphasis w/ `*`'
  )

  t.equal(
    m('____foo____'),
    '<p><strong><strong>foo</strong></strong></p>',
    'should support strong emphasis directly in strong emphasis w/ `_`'
  )

  t.equal(
    m('******foo******'),
    '<p><strong><strong><strong>foo</strong></strong></strong></p>',
    'should support indefinite strong emphasis'
  )

  // Rule 14.
  t.equal(
    m('***foo***'),
    '<p><em><strong>foo</strong></em></p>',
    'should support strong directly in emphasis w/ `*`'
  )

  t.equal(
    m('___foo___'),
    '<p><em><strong>foo</strong></em></p>',
    'should support strong directly in emphasis w/ `_`'
  )

  // Rule 15.
  t.equal(
    m('*foo _bar* baz_'),
    '<p><em>foo _bar</em> baz_</p>',
    'should not support mismatched emphasis'
  )

  t.equal(
    m('*foo __bar *baz bim__ bam*'),
    '<p><em>foo <strong>bar *baz bim</strong> bam</em></p>',
    'should not support mismatched strong emphasis'
  )

  // Rule 16.
  t.equal(
    m('**foo **bar baz**'),
    '<p>**foo <strong>bar baz</strong></p>',
    'should not shortest strong possible'
  )

  t.equal(
    m('*foo *bar baz*'),
    '<p>*foo <em>bar baz</em></p>',
    'should not shortest emphasis possible'
  )

  // Rule 17.
  t.equal(
    m('*[bar*](/url)'),
    '<p>*<a href="/url">bar*</a></p>',
    'should not mismatch inside links (1)'
  )

  t.equal(
    m('_[bar_](/url)'),
    '<p>_<a href="/url">bar_</a></p>',
    'should not mismatch inside links (1)'
  )

  t.equal(
    m('*<img src="foo" title="*"/>', {allowDangerousHtml: true}),
    '<p>*<img src="foo" title="*"/></p>',
    'should not end inside HTML'
  )

  t.equal(
    m('*<img src="foo" title="*"/>', {allowDangerousHtml: true}),
    '<p>*<img src="foo" title="*"/></p>',
    'should not end emphasis inside HTML'
  )

  t.equal(
    m('**<a href="**">', {allowDangerousHtml: true}),
    '<p>**<a href="**"></p>',
    'should not end strong inside HTML (1)'
  )

  t.equal(
    m('__<a href="__">', {allowDangerousHtml: true}),
    '<p>__<a href="__"></p>',
    'should not end strong inside HTML (2)'
  )

  t.equal(
    m('*a `*`*'),
    '<p><em>a <code>*</code></em></p>',
    'should not end emphasis inside code (1)'
  )

  t.equal(
    m('_a `_`_'),
    '<p><em>a <code>_</code></em></p>',
    'should not end emphasis inside code (2)'
  )

  t.equal(
    m('**a<http://foo.bar/?q=**>'),
    '<p>**a<a href="http://foo.bar/?q=**">http://foo.bar/?q=**</a></p>',
    'should not end strong emphasis inside autolinks (1)'
  )

  t.equal(
    m('__a<http://foo.bar/?q=__>'),
    '<p>__a<a href="http://foo.bar/?q=__">http://foo.bar/?q=__</a></p>',
    'should not end strong emphasis inside autolinks (2)'
  )

  t.end()
})
