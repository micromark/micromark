import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('emphasis', function () {
  // Rule 1.
  assert.equal(
    micromark('*foo bar*'),
    '<p><em>foo bar</em></p>',
    'should support emphasis w/ `*`'
  )

  assert.equal(
    micromark('a * foo bar*'),
    '<p>a * foo bar*</p>',
    'should not support emphasis if the opening is not left flanking (1)'
  )

  assert.equal(
    micromark('a*"foo"*'),
    '<p>a*&quot;foo&quot;*</p>',
    'should not support emphasis if the opening is not left flanking (2b)'
  )

  assert.equal(
    micromark('* a *'),
    '<p>* a *</p>',
    'should not support emphasis unicode whitespace either'
  )

  assert.equal(
    micromark('foo*bar*'),
    '<p>foo<em>bar</em></p>',
    'should support intraword emphasis w/ `*` (1)'
  )

  assert.equal(
    micromark('5*6*78'),
    '<p>5<em>6</em>78</p>',
    'should support intraword emphasis w/ `*` (2)'
  )

  // Rule 2.
  assert.equal(
    micromark('_foo bar_'),
    '<p><em>foo bar</em></p>',
    'should support emphasis w/ `_`'
  )

  assert.equal(
    micromark('_ foo bar_'),
    '<p>_ foo bar_</p>',
    'should not support emphasis if the opening is followed by whitespace'
  )

  assert.equal(
    micromark('a_"foo"_'),
    '<p>a_&quot;foo&quot;_</p>',
    'should not support emphasis if the opening is preceded by something else and followed by punctuation'
  )

  assert.equal(
    micromark('foo_bar_'),
    '<p>foo_bar_</p>',
    'should not support intraword emphasis (1)'
  )

  assert.equal(
    micromark('5_6_78'),
    '<p>5_6_78</p>',
    'should not support intraword emphasis (2)'
  )

  assert.equal(
    micromark('пристаням_стремятся_'),
    '<p>пристаням_стремятся_</p>',
    'should not support intraword emphasis (3)'
  )

  assert.equal(
    micromark('aa_"bb"_cc'),
    '<p>aa_&quot;bb&quot;_cc</p>',
    'should not support emphasis if the opening is right flanking and the closing is left flanking'
  )

  assert.equal(
    micromark('foo-_(bar)_'),
    '<p>foo-<em>(bar)</em></p>',
    'should support emphasis if the opening is both left and right flanking, if it’s preceded by punctuation'
  )

  // Rule 3.
  assert.equal(
    micromark('_foo*'),
    '<p>_foo*</p>',
    'should not support emphasis if opening and closing markers don’t match'
  )

  assert.equal(
    micromark('*foo bar *'),
    '<p>*foo bar *</p>',
    'should not support emphasis w/ `*` if the closing markers are preceded by whitespace'
  )

  assert.equal(
    micromark('*foo bar\n*'),
    '<p>*foo bar\n*</p>',
    'should not support emphasis w/ `*` if the closing markers are preceded by a line break (also whitespace)'
  )

  assert.equal(
    micromark('*(*foo)'),
    '<p>*(*foo)</p>',
    'should not support emphasis w/ `*` if the closing markers are not right flanking'
  )

  assert.equal(
    micromark('*(*foo*)*'),
    '<p><em>(<em>foo</em>)</em></p>',
    'should support nested emphasis'
  )

  // Rule 4.

  assert.equal(
    micromark('_foo bar _'),
    '<p>_foo bar _</p>',
    'should not support emphasis if the closing `_` is preceded by whitespace'
  )

  assert.equal(
    micromark('_(_foo)'),
    '<p>_(_foo)</p>',
    'should not support emphasis w/ `_` if the closing markers are not right flanking'
  )

  assert.equal(
    micromark('_(_foo_)_'),
    '<p><em>(<em>foo</em>)</em></p>',
    'should support nested emphasis w/ `_`'
  )

  assert.equal(
    micromark('_foo_bar'),
    '<p>_foo_bar</p>',
    'should not support intraword emphasis w/ `_` (1)'
  )

  assert.equal(
    micromark('_пристаням_стремятся'),
    '<p>_пристаням_стремятся</p>',
    'should not support intraword emphasis w/ `_` (2)'
  )

  assert.equal(
    micromark('_foo_bar_baz_'),
    '<p><em>foo_bar_baz</em></p>',
    'should not support intraword emphasis w/ `_` (3)'
  )

  assert.equal(
    micromark('_(bar)_.'),
    '<p><em>(bar)</em>.</p>',
    'should support emphasis if the opening is both left and right flanking, if it’s followed by punctuation'
  )

  // Rule 5.
  assert.equal(
    micromark('**foo bar**'),
    '<p><strong>foo bar</strong></p>',
    'should support strong emphasis'
  )

  assert.equal(
    micromark('** foo bar**'),
    '<p>** foo bar**</p>',
    'should not support strong emphasis if the opening is followed by whitespace'
  )

  assert.equal(
    micromark('a**"foo"**'),
    '<p>a**&quot;foo&quot;**</p>',
    'should not support strong emphasis if the opening is preceded by something else and followed by punctuation'
  )

  assert.equal(
    micromark('foo**bar**'),
    '<p>foo<strong>bar</strong></p>',
    'should support strong intraword emphasis'
  )

  // Rule 6.
  assert.equal(
    micromark('__foo bar__'),
    '<p><strong>foo bar</strong></p>',
    'should support strong emphasis w/ `_`'
  )

  assert.equal(
    micromark('__ foo bar__'),
    '<p>__ foo bar__</p>',
    'should not support strong emphasis if the opening is followed by whitespace'
  )

  assert.equal(
    micromark('__\nfoo bar__'),
    '<p>__\nfoo bar__</p>',
    'should not support strong emphasis if the opening is followed by a line ending (also whitespace)'
  )

  assert.equal(
    micromark('a__"foo"__'),
    '<p>a__&quot;foo&quot;__</p>',
    'should not support strong emphasis if the opening is preceded by something else and followed by punctuation'
  )

  assert.equal(
    micromark('foo__bar__'),
    '<p>foo__bar__</p>',
    'should not support strong intraword emphasis w/ `_` (1)'
  )

  assert.equal(
    micromark('5__6__78'),
    '<p>5__6__78</p>',
    'should not support strong intraword emphasis w/ `_` (2)'
  )

  assert.equal(
    micromark('пристаням__стремятся__'),
    '<p>пристаням__стремятся__</p>',
    'should not support strong intraword emphasis w/ `_` (3)'
  )

  assert.equal(
    micromark('__foo, __bar__, baz__'),
    '<p><strong>foo, <strong>bar</strong>, baz</strong></p>',
    'should support nested strong emphasis'
  )

  assert.equal(
    micromark('foo-__(bar)__'),
    '<p>foo-<strong>(bar)</strong></p>',
    'should support strong emphasis if the opening is both left and right flanking, if it’s preceded by punctuation'
  )

  // Rule 7.
  assert.equal(
    micromark('**foo bar **'),
    '<p>**foo bar **</p>',
    'should not support strong emphasis w/ `*` if the closing is preceded by whitespace'
  )

  assert.equal(
    micromark('**(**foo)'),
    '<p>**(**foo)</p>',
    'should not support strong emphasis w/ `*` if the closing is preceded by punctuation and followed by something else'
  )

  assert.equal(
    micromark('*(**foo**)*'),
    '<p><em>(<strong>foo</strong>)</em></p>',
    'should support strong emphasis in emphasis'
  )

  assert.equal(
    micromark(
      '**Gomphocarpus (*Gomphocarpus physocarpus*, syn.\n*Asclepias physocarpa*)**'
    ),
    '<p><strong>Gomphocarpus (<em>Gomphocarpus physocarpus</em>, syn.\n<em>Asclepias physocarpa</em>)</strong></p>',
    'should support emphasis in strong emphasis (1)'
  )

  assert.equal(
    micromark('**foo "*bar*" foo**'),
    '<p><strong>foo &quot;<em>bar</em>&quot; foo</strong></p>',
    'should support emphasis in strong emphasis (2)'
  )

  assert.equal(
    micromark('**foo**bar'),
    '<p><strong>foo</strong>bar</p>',
    'should support strong intraword emphasis'
  )

  // Rule 8.
  assert.equal(
    micromark('__foo bar __'),
    '<p>__foo bar __</p>',
    'should not support strong emphasis w/ `_` if the closing is preceded by whitespace'
  )

  assert.equal(
    micromark('__(__foo)'),
    '<p>__(__foo)</p>',
    'should not support strong emphasis w/ `_` if the closing is preceded by punctuation and followed by something else'
  )

  assert.equal(
    micromark('_(__foo__)_'),
    '<p><em>(<strong>foo</strong>)</em></p>',
    'should support strong emphasis w/ `_` in emphasis'
  )

  assert.equal(
    micromark('__foo__bar'),
    '<p>__foo__bar</p>',
    'should not support strong intraword emphasis w/ `_` (1)'
  )

  assert.equal(
    micromark('__пристаням__стремятся'),
    '<p>__пристаням__стремятся</p>',
    'should not support strong intraword emphasis w/ `_` (2)'
  )

  assert.equal(
    micromark('__foo__bar__baz__'),
    '<p><strong>foo__bar__baz</strong></p>',
    'should not support strong intraword emphasis w/ `_` (3)'
  )

  assert.equal(
    micromark('__(bar)__.'),
    '<p><strong>(bar)</strong>.</p>',
    'should support strong emphasis if the opening is both left and right flanking, if it’s followed by punctuation'
  )

  // Rule 9.
  assert.equal(
    micromark('*foo [bar](/url)*'),
    '<p><em>foo <a href="/url">bar</a></em></p>',
    'should support content in emphasis'
  )

  assert.equal(
    micromark('*foo\nbar*'),
    '<p><em>foo\nbar</em></p>',
    'should support line endings in emphasis'
  )

  assert.equal(
    micromark('_foo __bar__ baz_'),
    '<p><em>foo <strong>bar</strong> baz</em></p>',
    'should support nesting emphasis and strong (1)'
  )

  assert.equal(
    micromark('_foo _bar_ baz_'),
    '<p><em>foo <em>bar</em> baz</em></p>',
    'should support nesting emphasis and strong (2)'
  )

  assert.equal(
    micromark('__foo_ bar_'),
    '<p><em><em>foo</em> bar</em></p>',
    'should support nesting emphasis and strong (3)'
  )

  assert.equal(
    micromark('*foo *bar**'),
    '<p><em>foo <em>bar</em></em></p>',
    'should support nesting emphasis and strong (4)'
  )

  assert.equal(
    micromark('*foo **bar** baz*'),
    '<p><em>foo <strong>bar</strong> baz</em></p>',
    'should support nesting emphasis and strong (5)'
  )

  assert.equal(
    micromark('*foo**bar**baz*'),
    '<p><em>foo<strong>bar</strong>baz</em></p>',
    'should support nesting emphasis and strong (6)'
  )

  assert.equal(
    micromark('*foo**bar*'),
    '<p><em>foo**bar</em></p>',
    'should not support adjacent emphasis in certain cases'
  )

  assert.equal(
    micromark('***foo** bar*'),
    '<p><em><strong>foo</strong> bar</em></p>',
    'complex (1)'
  )
  assert.equal(
    micromark('*foo **bar***'),
    '<p><em>foo <strong>bar</strong></em></p>',
    'complex (2)'
  )
  assert.equal(
    micromark('*foo**bar***'),
    '<p><em>foo<strong>bar</strong></em></p>',
    'complex (3)'
  )

  assert.equal(
    micromark('foo***bar***baz'),
    '<p>foo<em><strong>bar</strong></em>baz</p>',
    'complex (a)'
  )
  assert.equal(
    micromark('foo******bar*********baz'),
    '<p>foo<strong><strong><strong>bar</strong></strong></strong>***baz</p>',
    'complex (b)'
  )

  assert.equal(
    micromark('*foo **bar *baz* bim** bop*'),
    '<p><em>foo <strong>bar <em>baz</em> bim</strong> bop</em></p>',
    'should support indefinite nesting of emphasis (1)'
  )

  assert.equal(
    micromark('*foo [*bar*](/url)*'),
    '<p><em>foo <a href="/url"><em>bar</em></a></em></p>',
    'should support indefinite nesting of emphasis (2)'
  )

  assert.equal(
    micromark('** is not an empty emphasis'),
    '<p>** is not an empty emphasis</p>',
    'should not support empty emphasis'
  )

  assert.equal(
    micromark('**** is not an empty emphasis'),
    '<p>**** is not an empty emphasis</p>',
    'should not support empty strong emphasis'
  )

  // Rule 10.
  assert.equal(
    micromark('**foo [bar](/url)**'),
    '<p><strong>foo <a href="/url">bar</a></strong></p>',
    'should support content in strong emphasis'
  )

  assert.equal(
    micromark('**foo\nbar**'),
    '<p><strong>foo\nbar</strong></p>',
    'should support line endings in emphasis'
  )

  assert.equal(
    micromark('__foo _bar_ baz__'),
    '<p><strong>foo <em>bar</em> baz</strong></p>',
    'should support nesting emphasis and strong (1)'
  )

  assert.equal(
    micromark('__foo __bar__ baz__'),
    '<p><strong>foo <strong>bar</strong> baz</strong></p>',
    'should support nesting emphasis and strong (2)'
  )

  assert.equal(
    micromark('____foo__ bar__'),
    '<p><strong><strong>foo</strong> bar</strong></p>',
    'should support nesting emphasis and strong (3)'
  )

  assert.equal(
    micromark('**foo **bar****'),
    '<p><strong>foo <strong>bar</strong></strong></p>',
    'should support nesting emphasis and strong (4)'
  )

  assert.equal(
    micromark('**foo *bar* baz**'),
    '<p><strong>foo <em>bar</em> baz</strong></p>',
    'should support nesting emphasis and strong (5)'
  )

  assert.equal(
    micromark('**foo*bar*baz**'),
    '<p><strong>foo<em>bar</em>baz</strong></p>',
    'should support nesting emphasis and strong (6)'
  )

  assert.equal(
    micromark('***foo* bar**'),
    '<p><strong><em>foo</em> bar</strong></p>',
    'should support nesting emphasis and strong (7)'
  )

  assert.equal(
    micromark('**foo *bar***'),
    '<p><strong>foo <em>bar</em></strong></p>',
    'should support nesting emphasis and strong (8)'
  )

  assert.equal(
    micromark('**foo *bar **baz**\nbim* bop**'),
    '<p><strong>foo <em>bar <strong>baz</strong>\nbim</em> bop</strong></p>',
    'should support indefinite nesting of emphasis (1)'
  )

  assert.equal(
    micromark('**foo [*bar*](/url)**'),
    '<p><strong>foo <a href="/url"><em>bar</em></a></strong></p>',
    'should support indefinite nesting of emphasis (2)'
  )

  assert.equal(
    micromark('__ is not an empty emphasis'),
    '<p>__ is not an empty emphasis</p>',
    'should not support empty emphasis'
  )

  assert.equal(
    micromark('____ is not an empty emphasis'),
    '<p>____ is not an empty emphasis</p>',
    'should not support empty strong emphasis'
  )

  // Rule 11.
  assert.equal(
    micromark('foo ***'),
    '<p>foo ***</p>',
    'should not support emphasis around the same marker'
  )

  assert.equal(
    micromark('foo *\\**'),
    '<p>foo <em>*</em></p>',
    'should support emphasis around an escaped marker'
  )

  assert.equal(
    micromark('foo *_*'),
    '<p>foo <em>_</em></p>',
    'should support emphasis around the other marker'
  )

  assert.equal(
    micromark('foo *****'),
    '<p>foo *****</p>',
    'should not support strong emphasis around the same marker'
  )

  assert.equal(
    micromark('foo **\\***'),
    '<p>foo <strong>*</strong></p>',
    'should support strong emphasis around an escaped marker'
  )

  assert.equal(
    micromark('foo **_**'),
    '<p>foo <strong>_</strong></p>',
    'should support strong emphasis around the other marker'
  )

  assert.equal(
    micromark('**foo*'),
    '<p>*<em>foo</em></p>',
    'should support a superfluous marker at the start of emphasis'
  )

  assert.equal(
    micromark('*foo**'),
    '<p><em>foo</em>*</p>',
    'should support a superfluous marker at the end of emphasis'
  )

  assert.equal(
    micromark('***foo**'),
    '<p>*<strong>foo</strong></p>',
    'should support a superfluous marker at the start of strong'
  )

  assert.equal(
    micromark('****foo*'),
    '<p>***<em>foo</em></p>',
    'should support multiple superfluous markers at the start of strong'
  )

  assert.equal(
    micromark('**foo***'),
    '<p><strong>foo</strong>*</p>',
    'should support a superfluous marker at the end of strong'
  )

  assert.equal(
    micromark('*foo****'),
    '<p><em>foo</em>***</p>',
    'should support multiple superfluous markers at the end of strong'
  )

  // Rule 12.
  assert.equal(
    micromark('foo ___'),
    '<p>foo ___</p>',
    'should not support emphasis around the same marker'
  )

  assert.equal(
    micromark('foo _\\__'),
    '<p>foo <em>_</em></p>',
    'should support emphasis around an escaped marker'
  )

  assert.equal(
    micromark('foo _X_'),
    '<p>foo <em>X</em></p>',
    'should support emphasis around the other marker'
  )

  assert.equal(
    micromark('foo _____'),
    '<p>foo _____</p>',
    'should not support strong emphasis around the same marker'
  )

  assert.equal(
    micromark('foo __\\___'),
    '<p>foo <strong>_</strong></p>',
    'should support strong emphasis around an escaped marker'
  )

  assert.equal(
    micromark('foo __X__'),
    '<p>foo <strong>X</strong></p>',
    'should support strong emphasis around the other marker'
  )

  assert.equal(
    micromark('__foo_'),
    '<p>_<em>foo</em></p>',
    'should support a superfluous marker at the start of emphasis'
  )

  assert.equal(
    micromark('_foo__'),
    '<p><em>foo</em>_</p>',
    'should support a superfluous marker at the end of emphasis'
  )

  assert.equal(
    micromark('___foo__'),
    '<p>_<strong>foo</strong></p>',
    'should support a superfluous marker at the start of strong'
  )

  assert.equal(
    micromark('____foo_'),
    '<p>___<em>foo</em></p>',
    'should support multiple superfluous markers at the start of strong'
  )

  assert.equal(
    micromark('__foo___'),
    '<p><strong>foo</strong>_</p>',
    'should support a superfluous marker at the end of strong'
  )

  assert.equal(
    micromark('_foo____'),
    '<p><em>foo</em>___</p>',
    'should support multiple superfluous markers at the end of strong'
  )

  // Rule 13.
  assert.equal(
    micromark('**foo**'),
    '<p><strong>foo</strong></p>',
    'should support strong w/ `*`'
  )

  assert.equal(
    micromark('*_foo_*'),
    '<p><em><em>foo</em></em></p>',
    'should support emphasis directly in emphasis w/ `_` in `*`'
  )

  assert.equal(
    micromark('__foo__'),
    '<p><strong>foo</strong></p>',
    'should support strong w/ `_`'
  )

  assert.equal(
    micromark('_*foo*_'),
    '<p><em><em>foo</em></em></p>',
    'should support emphasis directly in emphasis w/ `*` in `_`'
  )

  assert.equal(
    micromark('****foo****'),
    '<p><strong><strong>foo</strong></strong></p>',
    'should support strong emphasis directly in strong emphasis w/ `*`'
  )

  assert.equal(
    micromark('____foo____'),
    '<p><strong><strong>foo</strong></strong></p>',
    'should support strong emphasis directly in strong emphasis w/ `_`'
  )

  assert.equal(
    micromark('******foo******'),
    '<p><strong><strong><strong>foo</strong></strong></strong></p>',
    'should support indefinite strong emphasis'
  )

  // Rule 14.
  assert.equal(
    micromark('***foo***'),
    '<p><em><strong>foo</strong></em></p>',
    'should support strong directly in emphasis w/ `*`'
  )

  assert.equal(
    micromark('___foo___'),
    '<p><em><strong>foo</strong></em></p>',
    'should support strong directly in emphasis w/ `_`'
  )

  // Rule 15.
  assert.equal(
    micromark('*foo _bar* baz_'),
    '<p><em>foo _bar</em> baz_</p>',
    'should not support mismatched emphasis'
  )

  assert.equal(
    micromark('*foo __bar *baz bim__ bam*'),
    '<p><em>foo <strong>bar *baz bim</strong> bam</em></p>',
    'should not support mismatched strong emphasis'
  )

  // Rule 16.
  assert.equal(
    micromark('**foo **bar baz**'),
    '<p>**foo <strong>bar baz</strong></p>',
    'should not shortest strong possible'
  )

  assert.equal(
    micromark('*foo *bar baz*'),
    '<p>*foo <em>bar baz</em></p>',
    'should not shortest emphasis possible'
  )

  // Rule 17.
  assert.equal(
    micromark('*[bar*](/url)'),
    '<p>*<a href="/url">bar*</a></p>',
    'should not mismatch inside links (1)'
  )

  assert.equal(
    micromark('_[bar_](/url)'),
    '<p>_<a href="/url">bar_</a></p>',
    'should not mismatch inside links (1)'
  )

  assert.equal(
    micromark('*<img src="foo" title="*"/>', {allowDangerousHtml: true}),
    '<p>*<img src="foo" title="*"/></p>',
    'should not end inside HTML'
  )

  assert.equal(
    micromark('*<img src="foo" title="*"/>', {allowDangerousHtml: true}),
    '<p>*<img src="foo" title="*"/></p>',
    'should not end emphasis inside HTML'
  )

  assert.equal(
    micromark('**<a href="**">', {allowDangerousHtml: true}),
    '<p>**<a href="**"></p>',
    'should not end strong inside HTML (1)'
  )

  assert.equal(
    micromark('__<a href="__">', {allowDangerousHtml: true}),
    '<p>__<a href="__"></p>',
    'should not end strong inside HTML (2)'
  )

  assert.equal(
    micromark('*a `*`*'),
    '<p><em>a <code>*</code></em></p>',
    'should not end emphasis inside code (1)'
  )

  assert.equal(
    micromark('_a `_`_'),
    '<p><em>a <code>_</code></em></p>',
    'should not end emphasis inside code (2)'
  )

  // See: <https://github.com/commonmark/commonmark-spec/pull/739>
  assert.equal(
    micromark('*$*a.'),
    '<p>*$*a.</p>',
    'should support symbols correctly (1, ASCII symbol)'
  )

  assert.equal(
    micromark('*£*a.'),
    '<p>*£*a.</p>',
    'should support symbols correctly (2, unicode symbol)'
  )

  assert.equal(
    micromark('*€*a.'),
    '<p>*€*a.</p>',
    'should support symbols correctly (3, unicode symbol)'
  )

  assert.equal(
    micromark('**a<http://foo.bar/?q=**>'),
    '<p>**a<a href="http://foo.bar/?q=**">http://foo.bar/?q=**</a></p>',
    'should not end strong emphasis inside autolinks (1)'
  )

  assert.equal(
    micromark('__a<http://foo.bar/?q=__>'),
    '<p>__a<a href="http://foo.bar/?q=__">http://foo.bar/?q=__</a></p>',
    'should not end strong emphasis inside autolinks (2)'
  )

  assert.equal(
    micromark('*a*', {extensions: [{disable: {null: ['attention']}}]}),
    '<p>*a*</p>',
    'should support turning off attention'
  )

  assert.equal(
    micromark(`これは**私のやりたかったこと。**だからするの。`),
    '<p>これは<strong>私のやりたかったこと。</strong>だからするの。</p>',
    'should support CJK characters in emphasis (1)'
  )

  assert.equal(
    micromark(
      `**[製品ほげ](./product-foo)**と**[製品ふが](./product-bar)**をお試しください`
    ),
    '<p><strong><a href="./product-foo">製品ほげ</a></strong>と<strong><a href="./product-bar">製品ふが</a></strong>をお試しください</p>',
    'should support CJK characters in emphasis (2)'
  )
  assert.equal(
    micromark(`単語と**[単語と](word-and)**単語`),
    '<p>単語と<strong><a href="word-and">単語と</a></strong>単語</p>'
  )
  assert.equal(
    micromark(`**これは太字になりません。**ご注意ください。`),
    '<p><strong>これは太字になりません。</strong>ご注意ください。</p>'
  )
  assert.equal(
    micromark(`カッコに注意**（太字にならない）**文が続く場合に要警戒。`),
    '<p>カッコに注意<strong>（太字にならない）</strong>文が続く場合に要警戒。</p>'
  )
  assert.equal(
    micromark(`**[リンク](https://example.com)**も注意。（画像も同様）`),
    '<p><strong><a href="https://example.com">リンク</a></strong>も注意。（画像も同様）</p>'
  )
  assert.equal(
    micromark(`先頭の**\`コード\`も注意。**`),
    '<p>先頭の<strong><code>コード</code>も注意。</strong></p>'
  )
  assert.equal(
    micromark(`**末尾の\`コード\`**も注意。`),
    '<p><strong>末尾の<code>コード</code></strong>も注意。</p>'
  )
  assert.equal(
    micromark(`税込**¥10,000**で入手できます。`),
    '<p>税込<strong>¥10,000</strong>で入手できます。</p>'
  )
  assert.equal(
    micromark(`正解は**④**です。`),
    '<p>正解は<strong>④</strong>です。</p>'
  )
  assert.equal(
    micromark(`太郎は\\ **「こんにちわ」**\\ といった`),
    '<p>太郎は\\ <strong>「こんにちわ」</strong>\\ といった</p>'
  )
  assert.equal(
    micromark(`太郎は&#x200B;**「こんにちわ」**&#x200B;といった`),
    '<p>太郎は\u200B<strong>「こんにちわ」</strong>\u200Bといった</p>'
  )
  assert.equal(
    micromark(`太郎は${'\u200B'}**「こんにちわ」**${'\u200B'}といった`),
    '<p>太郎は\u200B<strong>「こんにちわ」</strong>\u200Bといった</p>'
  )
  assert.equal(
    micromark(`太郎は${'\u200B'} **「こんにちわ」**${'\u200B'} といった`),
    '<p>太郎は\u200B <strong>「こんにちわ」</strong>\u200B といった</p>'
  )
  assert.equal(
    micromark(`太郎は**「こんにちわ」**といった`),
    '<p>太郎は<strong>「こんにちわ」</strong>といった</p>'
  )
  assert.equal(
    micromark(`太郎は**"こんにちわ"**といった`),
    '<p>太郎は<strong>&quot;こんにちわ&quot;</strong>といった</p>'
  )
  assert.equal(
    micromark(`太郎は**こんにちわ**といった`),
    '<p>太郎は<strong>こんにちわ</strong>といった</p>'
  )
  assert.equal(
    micromark(`太郎は**「Hello」**といった`),
    '<p>太郎は<strong>「Hello」</strong>といった</p>'
  )
  assert.equal(
    micromark(`太郎は**"Hello"**といった`),
    '<p>太郎は<strong>&quot;Hello&quot;</strong>といった</p>'
  )
  assert.equal(
    micromark(`太郎は**Hello**といった`),
    '<p>太郎は<strong>Hello</strong>といった</p>'
  )
  assert.equal(
    micromark(`太郎は**「Oh my god」**といった`),
    '<p>太郎は<strong>「Oh my god」</strong>といった</p>'
  )
  assert.equal(
    micromark(`太郎は**"Oh my god"**といった`),
    '<p>太郎は<strong>&quot;Oh my god&quot;</strong>といった</p>'
  )
  assert.equal(
    micromark(`太郎は**Oh my god**といった`),
    '<p>太郎は<strong>Oh my god</strong>といった</p>'
  )
  assert.equal(
    micromark(
      `**C#**や**F#**は**「.NET」**というプラットフォーム上で動作します。`
    ),
    '<p><strong>C#</strong>や<strong>F#</strong>は<strong>「.NET」</strong>というプラットフォーム上で動作します。</p>'
  )
  assert.equal(
    micromark(`IDが**001号**になります。`),
    '<p>IDが<strong>001号</strong>になります。</p>'
  )
  assert.equal(
    micromark(`IDが**００１号**になります。`),
    '<p>IDが<strong>００１号</strong>になります。</p>'
  )
  assert.equal(
    micromark(`Go**「初心者」**を対象とした記事です。`),
    '<p>Go<strong>「初心者」</strong>を対象とした記事です。</p>'
  )
  assert.equal(
    micromark(`**[リンク](https://example.com)**も注意。`),
    '<p><strong><a href="https://example.com">リンク</a></strong>も注意。</p>'
  )
  assert.equal(micromark(`先頭の**`), '<p>先頭の**</p>')
  assert.equal(micromark(`も注意。**`), '<p>も注意。**</p>')
  assert.equal(
    micromark(`**⻲田太郎**と申します`),
    '<p><strong>⻲田太郎</strong>と申します</p>'
  )
  assert.equal(
    micromark(`・**㋐**:選択肢１つ目`),
    '<p>・<strong>㋐</strong>:選択肢１つ目</p>'
  )
  assert.equal(micromark(`**真，**她`), '<p><strong>真，</strong>她</p>')
  assert.equal(micromark(`**真。**她`), '<p><strong>真。</strong>她</p>')
  assert.equal(micromark(`**真、**她`), '<p><strong>真、</strong>她</p>')
  assert.equal(micromark(`**真；**她`), '<p><strong>真；</strong>她</p>')
  assert.equal(micromark(`**真：**她`), '<p><strong>真：</strong>她</p>')
  assert.equal(micromark(`**真？**她`), '<p><strong>真？</strong>她</p>')
  assert.equal(micromark(`**真！**她`), '<p><strong>真！</strong>她</p>')
  assert.equal(micromark(`**真“**她`), '<p><strong>真“</strong>她</p>')
  assert.equal(micromark(`**真”**她`), '<p><strong>真”</strong>她</p>')
  assert.equal(micromark(`**真‘**她`), '<p><strong>真‘</strong>她</p>')
  assert.equal(micromark(`**真’**她`), '<p><strong>真’</strong>她</p>')
  assert.equal(micromark(`**真（**她`), '<p><strong>真（</strong>她</p>')
  assert.equal(micromark(`真**（她**`), '<p>真<strong>（她</strong></p>')
  assert.equal(micromark(`**真）**她`), '<p><strong>真）</strong>她</p>')
  assert.equal(micromark(`**真【**她`), '<p><strong>真【</strong>她</p>')
  assert.equal(micromark(`真**【她**`), '<p>真<strong>【她</strong></p>')
  assert.equal(micromark(`**真】**她`), '<p><strong>真】</strong>她</p>')
  assert.equal(micromark(`**真《**她`), '<p><strong>真《</strong>她</p>')
  assert.equal(micromark(`真**《她**`), '<p>真<strong>《她</strong></p>')
  assert.equal(micromark(`**真》**她`), '<p><strong>真》</strong>她</p>')
  assert.equal(micromark(`**真—**她`), '<p><strong>真—</strong>她</p>')
  assert.equal(micromark(`**真～**她`), '<p><strong>真～</strong>她</p>')
  assert.equal(micromark(`**真…**她`), '<p><strong>真…</strong>她</p>')
  assert.equal(micromark(`**真·**她`), '<p><strong>真·</strong>她</p>')
  assert.equal(micromark(`**真〃**她`), '<p><strong>真〃</strong>她</p>')
  assert.equal(micromark(`**真-**她`), '<p><strong>真-</strong>她</p>')
  assert.equal(micromark(`**真々**她`), '<p><strong>真々</strong>她</p>')
  assert.equal(micromark(`**真**她`), '<p><strong>真</strong>她</p>')
  assert.equal(micromark(`**真，** 她`), '<p><strong>真，</strong> 她</p>')
  assert.equal(micromark(`**真**，她`), '<p><strong>真</strong>，她</p>')
  assert.equal(
    micromark(`**真，**&ZeroWidthSpace;她`),
    '<p><strong>真，</strong>\u200B她</p>'
  )
  assert.equal(
    micromark(`私は**⻲田太郎**と申します`),
    '<p>私は<strong>⻲田太郎</strong>と申します</p>'
  )
  assert.equal(
    micromark(`選択肢**㋐**: 1つ目の選択肢`),
    '<p>選択肢<strong>㋐</strong>: 1つ目の選択肢</p>'
  )
  assert.equal(
    micromark(`**さようなら︙**と太郎はいった。`),
    '<p><strong>さようなら︙</strong>と太郎はいった。</p>'
  )
  assert.equal(
    micromark(`.NET**（.NET Frameworkは不可）**では、`),
    '<p>.NET<strong>（.NET Frameworkは不可）</strong>では、</p>'
  )
  assert.equal(
    micromark(`「禰󠄀」の偏は示ではなく**礻**です。`),
    '<p>「禰󠄀」の偏は示ではなく<strong>礻</strong>です。</p>'
  )
  assert.equal(
    micromark(`Git**（注：不是GitHub）**`),
    '<p>Git<strong>（注：不是GitHub）</strong></p>'
  )
  assert.equal(
    micromark(`太郎は**「こんにちわ」**といった。`),
    '<p>太郎は<strong>「こんにちわ」</strong>といった。</p>'
  )
  assert.equal(
    micromark(`𰻞𰻞**（ビャンビャン）**麺`),
    '<p>𰻞𰻞<strong>（ビャンビャン）</strong>麺</p>'
  )
  assert.equal(
    micromark(`𰻞𰻞**(ビャンビャン)**麺`),
    '<p>𰻞𰻞<strong>(ビャンビャン)</strong>麺</p>'
  )
  assert.equal(
    micromark(`ハイパーテキストコーヒーポット制御プロトコル**(HTCPCP)**`),
    '<p>ハイパーテキストコーヒーポット制御プロトコル<strong>(HTCPCP)</strong></p>'
  )
  assert.equal(micromark(`﨑**(崎)**`), '<p>﨑<strong>(崎)</strong></p>')
  assert.equal(
    micromark(`国際規格**[ECMA-262](https://tc39.es/ecma262/)**`),
    '<p>国際規格<strong><a href="https://tc39.es/ecma262/">ECMA-262</a></strong></p>'
  )
  assert.equal(
    micromark(`㐧**(第の俗字)**`),
    '<p>㐧<strong>(第の俗字)</strong></p>'
  )
  assert.equal(
    micromark(`𠮟**(こちらが正式表記)**`),
    '<p>𠮟<strong>(こちらが正式表記)</strong></p>'
  )
  assert.equal(
    micromark(`𪜈**(トモの合略仮名)**`),
    '<p>𪜈<strong>(トモの合略仮名)</strong></p>'
  )
  assert.equal(
    micromark(`𫠉**(馬の俗字)**`),
    '<p>𫠉<strong>(馬の俗字)</strong></p>'
  )
  assert.equal(
    micromark(`谺𬤲**(こだま)**石神社`),
    '<p>谺𬤲<strong>(こだま)</strong>石神社</p>'
  )
  assert.equal(
    micromark(`石𮧟**(いしただら)**`),
    '<p>石𮧟<strong>(いしただら)</strong></p>'
  )
  assert.equal(
    micromark(`**推荐几个框架：**React、Vue等前端框架。`),
    '<p><strong>推荐几个框架：</strong>React、Vue等前端框架。</p>'
  )
  assert.equal(
    micromark(`葛󠄀**(こちらが正式表記)**城市`),
    '<p>葛󠄀<strong>(こちらが正式表記)</strong>城市</p>'
  )
  assert.equal(
    micromark(`禰󠄀**(こちらが正式表記)**豆子`),
    '<p>禰󠄀<strong>(こちらが正式表記)</strong>豆子</p>'
  )
  assert.equal(
    micromark(`𱟛**(U+317DB)**`),
    '<p>𱟛<strong>(U+317DB)</strong></p>'
  )
  assert.equal(
    micromark(`阿寒湖アイヌシアターイコㇿ**(Akanko Ainu Theater Ikor)**`),
    '<p>阿寒湖アイヌシアターイコㇿ<strong>(Akanko Ainu Theater Ikor)</strong></p>'
  )
  assert.equal(
    micromark(`あ𛀙**(か)**よろし`),
    '<p>あ𛀙<strong>(か)</strong>よろし</p>'
  )
  assert.equal(
    micromark(`𮹝**(simplified form of 龘 in China)**`),
    '<p>𮹝<strong>(simplified form of 龘 in China)</strong></p>'
  )
  assert.equal(
    micromark('大塚︀**(U+585A U+FE00)** 大塚**(U+FA10)**'),
    '<p>大塚︀<strong>(U+585A U+FE00)</strong> 大塚<strong>(U+FA10)</strong></p>',
    'should skip previous SVS character (VS01)'
  )
  assert.equal(
    micromark('〽︎**(庵点)**は、'),
    '<p>〽︎<strong>(庵点)</strong>は、</p>',
    'should skip previous SVS character (VS15)'
  )
})
