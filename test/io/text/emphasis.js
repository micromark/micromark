import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('emphasis', async function (t) {
  await t.test('should support emphasis w/ `*`', async function () {
    // Rule 1.
    assert.equal(micromark('*foo bar*'), '<p><em>foo bar</em></p>')
  })

  await t.test(
    'should not support emphasis if the opening is not left flanking (1)',
    async function () {
      assert.equal(micromark('a * foo bar*'), '<p>a * foo bar*</p>')
    }
  )

  await t.test(
    'should not support emphasis if the opening is not left flanking (2b)',
    async function () {
      assert.equal(micromark('a*"foo"*'), '<p>a*&quot;foo&quot;*</p>')
    }
  )

  await t.test(
    'should not support emphasis unicode whitespace either',
    async function () {
      assert.equal(micromark('* a *'), '<p>* a *</p>')
    }
  )

  await t.test(
    'should support intraword emphasis w/ `*` (1)',
    async function () {
      assert.equal(micromark('foo*bar*'), '<p>foo<em>bar</em></p>')
    }
  )

  await t.test(
    'should support intraword emphasis w/ `*` (2)',
    async function () {
      assert.equal(micromark('5*6*78'), '<p>5<em>6</em>78</p>')
    }
  )

  await t.test('should support emphasis w/ `_`', async function () {
    // Rule 2.
    assert.equal(micromark('_foo bar_'), '<p><em>foo bar</em></p>')
  })

  await t.test(
    'should not support emphasis if the opening is followed by whitespace',
    async function () {
      assert.equal(micromark('_ foo bar_'), '<p>_ foo bar_</p>')
    }
  )

  await t.test(
    'should not support emphasis if the opening is preceded by something else and followed by punctuation',
    async function () {
      assert.equal(micromark('a_"foo"_'), '<p>a_&quot;foo&quot;_</p>')
    }
  )

  await t.test('should not support intraword emphasis (1)', async function () {
    assert.equal(micromark('foo_bar_'), '<p>foo_bar_</p>')
  })

  await t.test('should not support intraword emphasis (2)', async function () {
    assert.equal(micromark('5_6_78'), '<p>5_6_78</p>')
  })

  await t.test('should not support intraword emphasis (3)', async function () {
    assert.equal(
      micromark('пристаням_стремятся_'),
      '<p>пристаням_стремятся_</p>'
    )
  })

  await t.test(
    'should not support emphasis if the opening is right flanking and the closing is left flanking',
    async function () {
      assert.equal(micromark('aa_"bb"_cc'), '<p>aa_&quot;bb&quot;_cc</p>')
    }
  )

  await t.test(
    'should support emphasis if the opening is both left and right flanking, if it’s preceded by punctuation',
    async function () {
      assert.equal(micromark('foo-_(bar)_'), '<p>foo-<em>(bar)</em></p>')
    }
  )

  await t.test(
    'should not support emphasis if opening and closing markers don’t match',
    async function () {
      // Rule 3.
      assert.equal(micromark('_foo*'), '<p>_foo*</p>')
    }
  )

  await t.test(
    'should not support emphasis w/ `*` if the closing markers are preceded by whitespace',
    async function () {
      assert.equal(micromark('*foo bar *'), '<p>*foo bar *</p>')
    }
  )

  await t.test(
    'should not support emphasis w/ `*` if the closing markers are preceded by a line break (also whitespace)',
    async function () {
      assert.equal(micromark('*foo bar\n*'), '<p>*foo bar\n*</p>')
    }
  )

  await t.test(
    'should not support emphasis w/ `*` if the closing markers are not right flanking',
    async function () {
      assert.equal(micromark('*(*foo)'), '<p>*(*foo)</p>')
    }
  )

  await t.test('should support nested emphasis', async function () {
    assert.equal(micromark('*(*foo*)*'), '<p><em>(<em>foo</em>)</em></p>')
  })

  await t.test(
    'should not support emphasis if the closing `_` is preceded by whitespace',
    async function () {
      // Rule 4.

      assert.equal(micromark('_foo bar _'), '<p>_foo bar _</p>')
    }
  )

  await t.test(
    'should not support emphasis w/ `_` if the closing markers are not right flanking',
    async function () {
      assert.equal(micromark('_(_foo)'), '<p>_(_foo)</p>')
    }
  )

  await t.test('should support nested emphasis w/ `_`', async function () {
    assert.equal(micromark('_(_foo_)_'), '<p><em>(<em>foo</em>)</em></p>')
  })

  await t.test(
    'should not support intraword emphasis w/ `_` (1)',
    async function () {
      assert.equal(micromark('_foo_bar'), '<p>_foo_bar</p>')
    }
  )

  await t.test(
    'should not support intraword emphasis w/ `_` (2)',
    async function () {
      assert.equal(
        micromark('_пристаням_стремятся'),
        '<p>_пристаням_стремятся</p>'
      )
    }
  )

  await t.test(
    'should not support intraword emphasis w/ `_` (3)',
    async function () {
      assert.equal(micromark('_foo_bar_baz_'), '<p><em>foo_bar_baz</em></p>')
    }
  )

  await t.test(
    'should support emphasis if the opening is both left and right flanking, if it’s followed by punctuation',
    async function () {
      assert.equal(micromark('_(bar)_.'), '<p><em>(bar)</em>.</p>')
    }
  )

  await t.test('should support strong emphasis', async function () {
    // Rule 5.
    assert.equal(micromark('**foo bar**'), '<p><strong>foo bar</strong></p>')
  })

  await t.test(
    'should not support strong emphasis if the opening is followed by whitespace',
    async function () {
      assert.equal(micromark('** foo bar**'), '<p>** foo bar**</p>')
    }
  )

  await t.test(
    'should not support strong emphasis if the opening is preceded by something else and followed by punctuation',
    async function () {
      assert.equal(micromark('a**"foo"**'), '<p>a**&quot;foo&quot;**</p>')
    }
  )

  await t.test('should support strong intraword emphasis', async function () {
    assert.equal(micromark('foo**bar**'), '<p>foo<strong>bar</strong></p>')
  })

  await t.test('should support strong emphasis w/ `_`', async function () {
    // Rule 6.
    assert.equal(micromark('__foo bar__'), '<p><strong>foo bar</strong></p>')
  })

  await t.test(
    'should not support strong emphasis if the opening is followed by whitespace',
    async function () {
      assert.equal(micromark('__ foo bar__'), '<p>__ foo bar__</p>')
    }
  )

  await t.test(
    'should not support strong emphasis if the opening is followed by a line ending (also whitespace)',
    async function () {
      assert.equal(micromark('__\nfoo bar__'), '<p>__\nfoo bar__</p>')
    }
  )

  await t.test(
    'should not support strong emphasis if the opening is preceded by something else and followed by punctuation',
    async function () {
      assert.equal(micromark('a__"foo"__'), '<p>a__&quot;foo&quot;__</p>')
    }
  )

  await t.test(
    'should not support strong intraword emphasis w/ `_` (1)',
    async function () {
      assert.equal(micromark('foo__bar__'), '<p>foo__bar__</p>')
    }
  )

  await t.test(
    'should not support strong intraword emphasis w/ `_` (2)',
    async function () {
      assert.equal(micromark('5__6__78'), '<p>5__6__78</p>')
    }
  )

  await t.test(
    'should not support strong intraword emphasis w/ `_` (3)',
    async function () {
      assert.equal(
        micromark('пристаням__стремятся__'),
        '<p>пристаням__стремятся__</p>'
      )
    }
  )

  await t.test('should support nested strong emphasis', async function () {
    assert.equal(
      micromark('__foo, __bar__, baz__'),
      '<p><strong>foo, <strong>bar</strong>, baz</strong></p>'
    )
  })

  await t.test(
    'should support strong emphasis if the opening is both left and right flanking, if it’s preceded by punctuation',
    async function () {
      assert.equal(
        micromark('foo-__(bar)__'),
        '<p>foo-<strong>(bar)</strong></p>'
      )
    }
  )

  await t.test(
    'should not support strong emphasis w/ `*` if the closing is preceded by whitespace',
    async function () {
      // Rule 7.
      assert.equal(micromark('**foo bar **'), '<p>**foo bar **</p>')
    }
  )

  await t.test(
    'should not support strong emphasis w/ `*` if the closing is preceded by punctuation and followed by something else',
    async function () {
      assert.equal(micromark('**(**foo)'), '<p>**(**foo)</p>')
    }
  )

  await t.test('should support strong emphasis in emphasis', async function () {
    assert.equal(
      micromark('*(**foo**)*'),
      '<p><em>(<strong>foo</strong>)</em></p>'
    )
  })

  await t.test(
    'should support emphasis in strong emphasis (1)',
    async function () {
      assert.equal(
        micromark(
          '**Gomphocarpus (*Gomphocarpus physocarpus*, syn.\n*Asclepias physocarpa*)**'
        ),
        '<p><strong>Gomphocarpus (<em>Gomphocarpus physocarpus</em>, syn.\n<em>Asclepias physocarpa</em>)</strong></p>'
      )
    }
  )

  await t.test(
    'should support emphasis in strong emphasis (2)',
    async function () {
      assert.equal(
        micromark('**foo "*bar*" foo**'),
        '<p><strong>foo &quot;<em>bar</em>&quot; foo</strong></p>'
      )
    }
  )

  await t.test('should support strong intraword emphasis', async function () {
    assert.equal(micromark('**foo**bar'), '<p><strong>foo</strong>bar</p>')
  })

  await t.test(
    'should not support strong emphasis w/ `_` if the closing is preceded by whitespace',
    async function () {
      // Rule 8.
      assert.equal(micromark('__foo bar __'), '<p>__foo bar __</p>')
    }
  )

  await t.test(
    'should not support strong emphasis w/ `_` if the closing is preceded by punctuation and followed by something else',
    async function () {
      assert.equal(micromark('__(__foo)'), '<p>__(__foo)</p>')
    }
  )

  await t.test(
    'should support strong emphasis w/ `_` in emphasis',
    async function () {
      assert.equal(
        micromark('_(__foo__)_'),
        '<p><em>(<strong>foo</strong>)</em></p>'
      )
    }
  )

  await t.test(
    'should not support strong intraword emphasis w/ `_` (1)',
    async function () {
      assert.equal(micromark('__foo__bar'), '<p>__foo__bar</p>')
    }
  )

  await t.test(
    'should not support strong intraword emphasis w/ `_` (2)',
    async function () {
      assert.equal(
        micromark('__пристаням__стремятся'),
        '<p>__пристаням__стремятся</p>'
      )
    }
  )

  await t.test(
    'should not support strong intraword emphasis w/ `_` (3)',
    async function () {
      assert.equal(
        micromark('__foo__bar__baz__'),
        '<p><strong>foo__bar__baz</strong></p>'
      )
    }
  )

  await t.test(
    'should support strong emphasis if the opening is both left and right flanking, if it’s followed by punctuation',
    async function () {
      assert.equal(micromark('__(bar)__.'), '<p><strong>(bar)</strong>.</p>')
    }
  )

  await t.test('should support content in emphasis', async function () {
    // Rule 9.
    assert.equal(
      micromark('*foo [bar](/url)*'),
      '<p><em>foo <a href="/url">bar</a></em></p>'
    )
  })

  await t.test('should support line endings in emphasis', async function () {
    assert.equal(micromark('*foo\nbar*'), '<p><em>foo\nbar</em></p>')
  })

  await t.test(
    'should support nesting emphasis and strong (1)',
    async function () {
      assert.equal(
        micromark('_foo __bar__ baz_'),
        '<p><em>foo <strong>bar</strong> baz</em></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (2)',
    async function () {
      assert.equal(
        micromark('_foo _bar_ baz_'),
        '<p><em>foo <em>bar</em> baz</em></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (3)',
    async function () {
      assert.equal(micromark('__foo_ bar_'), '<p><em><em>foo</em> bar</em></p>')
    }
  )

  await t.test(
    'should support nesting emphasis and strong (4)',
    async function () {
      assert.equal(micromark('*foo *bar**'), '<p><em>foo <em>bar</em></em></p>')
    }
  )

  await t.test(
    'should support nesting emphasis and strong (5)',
    async function () {
      assert.equal(
        micromark('*foo **bar** baz*'),
        '<p><em>foo <strong>bar</strong> baz</em></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (6)',
    async function () {
      assert.equal(
        micromark('*foo**bar**baz*'),
        '<p><em>foo<strong>bar</strong>baz</em></p>'
      )
    }
  )

  await t.test(
    'should not support adjacent emphasis in certain cases',
    async function () {
      assert.equal(micromark('*foo**bar*'), '<p><em>foo**bar</em></p>')
    }
  )

  await t.test('complex (1)', async function () {
    assert.equal(
      micromark('***foo** bar*'),
      '<p><em><strong>foo</strong> bar</em></p>'
    )
  })

  await t.test('complex (2)', async function () {
    assert.equal(
      micromark('*foo **bar***'),
      '<p><em>foo <strong>bar</strong></em></p>'
    )
  })

  await t.test('complex (3)', async function () {
    assert.equal(
      micromark('*foo**bar***'),
      '<p><em>foo<strong>bar</strong></em></p>'
    )
  })

  await t.test('complex (a)', async function () {
    assert.equal(
      micromark('foo***bar***baz'),
      '<p>foo<em><strong>bar</strong></em>baz</p>'
    )
  })

  await t.test('complex (b)', async function () {
    assert.equal(
      micromark('foo******bar*********baz'),
      '<p>foo<strong><strong><strong>bar</strong></strong></strong>***baz</p>'
    )
  })

  await t.test(
    'should support indefinite nesting of emphasis (1)',
    async function () {
      assert.equal(
        micromark('*foo **bar *baz* bim** bop*'),
        '<p><em>foo <strong>bar <em>baz</em> bim</strong> bop</em></p>'
      )
    }
  )

  await t.test(
    'should support indefinite nesting of emphasis (2)',
    async function () {
      assert.equal(
        micromark('*foo [*bar*](/url)*'),
        '<p><em>foo <a href="/url"><em>bar</em></a></em></p>'
      )
    }
  )

  await t.test('should not support empty emphasis', async function () {
    assert.equal(
      micromark('** is not an empty emphasis'),
      '<p>** is not an empty emphasis</p>'
    )
  })

  await t.test('should not support empty strong emphasis', async function () {
    assert.equal(
      micromark('**** is not an empty emphasis'),
      '<p>**** is not an empty emphasis</p>'
    )
  })

  await t.test('should support content in strong emphasis', async function () {
    // Rule 10.
    assert.equal(
      micromark('**foo [bar](/url)**'),
      '<p><strong>foo <a href="/url">bar</a></strong></p>'
    )
  })

  await t.test('should support line endings in emphasis', async function () {
    assert.equal(micromark('**foo\nbar**'), '<p><strong>foo\nbar</strong></p>')
  })

  await t.test(
    'should support nesting emphasis and strong (1)',
    async function () {
      assert.equal(
        micromark('__foo _bar_ baz__'),
        '<p><strong>foo <em>bar</em> baz</strong></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (2)',
    async function () {
      assert.equal(
        micromark('__foo __bar__ baz__'),
        '<p><strong>foo <strong>bar</strong> baz</strong></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (3)',
    async function () {
      assert.equal(
        micromark('____foo__ bar__'),
        '<p><strong><strong>foo</strong> bar</strong></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (4)',
    async function () {
      assert.equal(
        micromark('**foo **bar****'),
        '<p><strong>foo <strong>bar</strong></strong></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (5)',
    async function () {
      assert.equal(
        micromark('**foo *bar* baz**'),
        '<p><strong>foo <em>bar</em> baz</strong></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (6)',
    async function () {
      assert.equal(
        micromark('**foo*bar*baz**'),
        '<p><strong>foo<em>bar</em>baz</strong></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (7)',
    async function () {
      assert.equal(
        micromark('***foo* bar**'),
        '<p><strong><em>foo</em> bar</strong></p>'
      )
    }
  )

  await t.test(
    'should support nesting emphasis and strong (8)',
    async function () {
      assert.equal(
        micromark('**foo *bar***'),
        '<p><strong>foo <em>bar</em></strong></p>'
      )
    }
  )

  await t.test(
    'should support indefinite nesting of emphasis (1)',
    async function () {
      assert.equal(
        micromark('**foo *bar **baz**\nbim* bop**'),
        '<p><strong>foo <em>bar <strong>baz</strong>\nbim</em> bop</strong></p>'
      )
    }
  )

  await t.test(
    'should support indefinite nesting of emphasis (2)',
    async function () {
      assert.equal(
        micromark('**foo [*bar*](/url)**'),
        '<p><strong>foo <a href="/url"><em>bar</em></a></strong></p>'
      )
    }
  )

  await t.test('should not support empty emphasis', async function () {
    assert.equal(
      micromark('__ is not an empty emphasis'),
      '<p>__ is not an empty emphasis</p>'
    )
  })

  await t.test('should not support empty strong emphasis', async function () {
    assert.equal(
      micromark('____ is not an empty emphasis'),
      '<p>____ is not an empty emphasis</p>'
    )
  })

  await t.test(
    'should not support emphasis around the same marker',
    async function () {
      // Rule 11.
      assert.equal(micromark('foo ***'), '<p>foo ***</p>')
    }
  )

  await t.test(
    'should support emphasis around an escaped marker',
    async function () {
      assert.equal(micromark('foo *\\**'), '<p>foo <em>*</em></p>')
    }
  )

  await t.test(
    'should support emphasis around the other marker',
    async function () {
      assert.equal(micromark('foo *_*'), '<p>foo <em>_</em></p>')
    }
  )

  await t.test(
    'should not support strong emphasis around the same marker',
    async function () {
      assert.equal(micromark('foo *****'), '<p>foo *****</p>')
    }
  )

  await t.test(
    'should support strong emphasis around an escaped marker',
    async function () {
      assert.equal(micromark('foo **\\***'), '<p>foo <strong>*</strong></p>')
    }
  )

  await t.test(
    'should support strong emphasis around the other marker',
    async function () {
      assert.equal(micromark('foo **_**'), '<p>foo <strong>_</strong></p>')
    }
  )

  await t.test(
    'should support a superfluous marker at the start of emphasis',
    async function () {
      assert.equal(micromark('**foo*'), '<p>*<em>foo</em></p>')
    }
  )

  await t.test(
    'should support a superfluous marker at the end of emphasis',
    async function () {
      assert.equal(micromark('*foo**'), '<p><em>foo</em>*</p>')
    }
  )

  await t.test(
    'should support a superfluous marker at the start of strong',
    async function () {
      assert.equal(micromark('***foo**'), '<p>*<strong>foo</strong></p>')
    }
  )

  await t.test(
    'should support multiple superfluous markers at the start of strong',
    async function () {
      assert.equal(micromark('****foo*'), '<p>***<em>foo</em></p>')
    }
  )

  await t.test(
    'should support a superfluous marker at the end of strong',
    async function () {
      assert.equal(micromark('**foo***'), '<p><strong>foo</strong>*</p>')
    }
  )

  await t.test(
    'should support multiple superfluous markers at the end of strong',
    async function () {
      assert.equal(micromark('*foo****'), '<p><em>foo</em>***</p>')
    }
  )

  await t.test(
    'should not support emphasis around the same marker',
    async function () {
      // Rule 12.
      assert.equal(micromark('foo ___'), '<p>foo ___</p>')
    }
  )

  await t.test(
    'should support emphasis around an escaped marker',
    async function () {
      assert.equal(micromark('foo _\\__'), '<p>foo <em>_</em></p>')
    }
  )

  await t.test(
    'should support emphasis around the other marker',
    async function () {
      assert.equal(micromark('foo _X_'), '<p>foo <em>X</em></p>')
    }
  )

  await t.test(
    'should not support strong emphasis around the same marker',
    async function () {
      assert.equal(micromark('foo _____'), '<p>foo _____</p>')
    }
  )

  await t.test(
    'should support strong emphasis around an escaped marker',
    async function () {
      assert.equal(micromark('foo __\\___'), '<p>foo <strong>_</strong></p>')
    }
  )

  await t.test(
    'should support strong emphasis around the other marker',
    async function () {
      assert.equal(micromark('foo __X__'), '<p>foo <strong>X</strong></p>')
    }
  )

  await t.test(
    'should support a superfluous marker at the start of emphasis',
    async function () {
      assert.equal(micromark('__foo_'), '<p>_<em>foo</em></p>')
    }
  )

  await t.test(
    'should support a superfluous marker at the end of emphasis',
    async function () {
      assert.equal(micromark('_foo__'), '<p><em>foo</em>_</p>')
    }
  )

  await t.test(
    'should support a superfluous marker at the start of strong',
    async function () {
      assert.equal(micromark('___foo__'), '<p>_<strong>foo</strong></p>')
    }
  )

  await t.test(
    'should support multiple superfluous markers at the start of strong',
    async function () {
      assert.equal(micromark('____foo_'), '<p>___<em>foo</em></p>')
    }
  )

  await t.test(
    'should support a superfluous marker at the end of strong',
    async function () {
      assert.equal(micromark('__foo___'), '<p><strong>foo</strong>_</p>')
    }
  )

  await t.test(
    'should support multiple superfluous markers at the end of strong',
    async function () {
      assert.equal(micromark('_foo____'), '<p><em>foo</em>___</p>')
    }
  )

  await t.test('should support strong w/ `*`', async function () {
    // Rule 13.
    assert.equal(micromark('**foo**'), '<p><strong>foo</strong></p>')
  })

  await t.test(
    'should support emphasis directly in emphasis w/ `_` in `*`',
    async function () {
      assert.equal(micromark('*_foo_*'), '<p><em><em>foo</em></em></p>')
    }
  )

  await t.test('should support strong w/ `_`', async function () {
    assert.equal(micromark('__foo__'), '<p><strong>foo</strong></p>')
  })

  await t.test(
    'should support emphasis directly in emphasis w/ `*` in `_`',
    async function () {
      assert.equal(micromark('_*foo*_'), '<p><em><em>foo</em></em></p>')
    }
  )

  await t.test(
    'should support strong emphasis directly in strong emphasis w/ `*`',
    async function () {
      assert.equal(
        micromark('****foo****'),
        '<p><strong><strong>foo</strong></strong></p>'
      )
    }
  )

  await t.test(
    'should support strong emphasis directly in strong emphasis w/ `_`',
    async function () {
      assert.equal(
        micromark('____foo____'),
        '<p><strong><strong>foo</strong></strong></p>'
      )
    }
  )

  await t.test('should support indefinite strong emphasis', async function () {
    assert.equal(
      micromark('******foo******'),
      '<p><strong><strong><strong>foo</strong></strong></strong></p>'
    )
  })

  await t.test(
    'should support strong directly in emphasis w/ `*`',
    async function () {
      // Rule 14.
      assert.equal(
        micromark('***foo***'),
        '<p><em><strong>foo</strong></em></p>'
      )
    }
  )

  await t.test(
    'should support strong directly in emphasis w/ `_`',
    async function () {
      assert.equal(
        micromark('___foo___'),
        '<p><em><strong>foo</strong></em></p>'
      )
    }
  )

  await t.test('should not support mismatched emphasis', async function () {
    // Rule 15.
    assert.equal(micromark('*foo _bar* baz_'), '<p><em>foo _bar</em> baz_</p>')
  })

  await t.test(
    'should not support mismatched strong emphasis',
    async function () {
      assert.equal(
        micromark('*foo __bar *baz bim__ bam*'),
        '<p><em>foo <strong>bar *baz bim</strong> bam</em></p>'
      )
    }
  )

  await t.test('should not shortest strong possible', async function () {
    // Rule 16.
    assert.equal(
      micromark('**foo **bar baz**'),
      '<p>**foo <strong>bar baz</strong></p>'
    )
  })

  await t.test('should not shortest emphasis possible', async function () {
    assert.equal(micromark('*foo *bar baz*'), '<p>*foo <em>bar baz</em></p>')
  })

  await t.test('should not mismatch inside links (1)', async function () {
    // Rule 17.
    assert.equal(micromark('*[bar*](/url)'), '<p>*<a href="/url">bar*</a></p>')
  })

  await t.test('should not mismatch inside links (1)', async function () {
    assert.equal(micromark('_[bar_](/url)'), '<p>_<a href="/url">bar_</a></p>')
  })

  await t.test('should not end inside HTML', async function () {
    assert.equal(
      micromark('*<img src="foo" title="*"/>', {allowDangerousHtml: true}),
      '<p>*<img src="foo" title="*"/></p>'
    )
  })

  await t.test('should not end emphasis inside HTML', async function () {
    assert.equal(
      micromark('*<img src="foo" title="*"/>', {allowDangerousHtml: true}),
      '<p>*<img src="foo" title="*"/></p>'
    )
  })

  await t.test('should not end strong inside HTML (1)', async function () {
    assert.equal(
      micromark('**<a href="**">', {allowDangerousHtml: true}),
      '<p>**<a href="**"></p>'
    )
  })

  await t.test('should not end strong inside HTML (2)', async function () {
    assert.equal(
      micromark('__<a href="__">', {allowDangerousHtml: true}),
      '<p>__<a href="__"></p>'
    )
  })

  await t.test('should not end emphasis inside code (1)', async function () {
    assert.equal(micromark('*a `*`*'), '<p><em>a <code>*</code></em></p>')
  })

  await t.test('should not end emphasis inside code (2)', async function () {
    assert.equal(micromark('_a `_`_'), '<p><em>a <code>_</code></em></p>')
  })

  await t.test(
    'should support symbols correctly (1, ASCII symbol)',
    async function () {
      // See: <https://github.com/commonmark/commonmark-spec/pull/739>
      assert.equal(micromark('*$*a.'), '<p>*$*a.</p>')
    }
  )

  await t.test(
    'should support symbols correctly (2, unicode symbol)',
    async function () {
      assert.equal(micromark('*£*a.'), '<p>*£*a.</p>')
    }
  )

  await t.test(
    'should support symbols correctly (3, unicode symbol)',
    async function () {
      assert.equal(micromark('*€*a.'), '<p>*€*a.</p>')
    }
  )

  await t.test(
    'should not end strong emphasis inside autolinks (1)',
    async function () {
      assert.equal(
        micromark('**a<http://foo.bar/?q=**>'),
        '<p>**a<a href="http://foo.bar/?q=**">http://foo.bar/?q=**</a></p>'
      )
    }
  )

  await t.test(
    'should not end strong emphasis inside autolinks (2)',
    async function () {
      assert.equal(
        micromark('__a<http://foo.bar/?q=__>'),
        '<p>__a<a href="http://foo.bar/?q=__">http://foo.bar/?q=__</a></p>'
      )
    }
  )

  await t.test('should support turning off attention', async function () {
    assert.equal(
      micromark('*a*', {extensions: [{disable: {null: ['attention']}}]}),
      '<p>*a*</p>'
    )
  })
})
