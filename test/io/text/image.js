import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('image', async function (t) {
  await t.test('should support image w/ resource', async function () {
    assert.equal(
      micromark('![foo](/url "title")'),
      '<p><img src="/url" alt="foo" title="title" /></p>'
    )
  })

  await t.test('should support image as shortcut reference', async function () {
    assert.equal(
      micromark('[foo *bar*]: train.jpg "train & tracks"\n\n![foo *bar*]'),
      '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>'
    )
  })

  await t.test('should “support” images in images', async function () {
    assert.equal(
      micromark('![foo ![bar](/url)](/url2)'),
      '<p><img src="/url2" alt="foo bar" /></p>'
    )
  })

  await t.test('should “support” links in images', async function () {
    assert.equal(
      micromark('![foo [bar](/url)](/url2)'),
      '<p><img src="/url2" alt="foo bar" /></p>'
    )
  })

  await t.test('should support “content” in images', async function () {
    assert.equal(
      micromark('[foo *bar*]: train.jpg "train & tracks"\n\n![foo *bar*][]'),
      '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>'
    )
  })

  await t.test('should support “content” in images', async function () {
    assert.equal(
      micromark('[FOOBAR]: train.jpg "train & tracks"\n\n![foo *bar*][foobar]'),
      '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>'
    )
  })

  await t.test('should support images w/o title', async function () {
    assert.equal(
      micromark('![foo](train.jpg)'),
      '<p><img src="train.jpg" alt="foo" /></p>'
    )
  })

  await t.test(
    'should support images w/ lots of whitespace',
    async function () {
      assert.equal(
        micromark('My ![foo bar](/path/to/train.jpg  "title"   )'),
        '<p>My <img src="/path/to/train.jpg" alt="foo bar" title="title" /></p>'
      )
    }
  )

  await t.test(
    'should support images w/ enclosed destinations',
    async function () {
      assert.equal(
        micromark('![foo](<url>)'),
        '<p><img src="url" alt="foo" /></p>'
      )
    }
  )

  await t.test('should support images w/ empty labels', async function () {
    assert.equal(micromark('![](/url)'), '<p><img src="/url" alt="" /></p>')
  })

  await t.test('should support full references (1)', async function () {
    assert.equal(
      micromark('[bar]: /url\n\n![foo][bar]'),
      '<p><img src="/url" alt="foo" /></p>'
    )
  })

  await t.test('should support full references (2)', async function () {
    assert.equal(
      micromark('[BAR]: /url\n\n![foo][bar]'),
      '<p><img src="/url" alt="foo" /></p>'
    )
  })

  await t.test('should support collapsed references (1)', async function () {
    assert.equal(
      micromark('[foo]: /url "title"\n\n![foo][]'),
      '<p><img src="/url" alt="foo" title="title" /></p>'
    )
  })

  await t.test('should support collapsed references (2)', async function () {
    assert.equal(
      micromark('[*foo* bar]: /url "title"\n\n![*foo* bar][]'),
      '<p><img src="/url" alt="foo bar" title="title" /></p>'
    )
  })

  await t.test('should support case-insensitive labels', async function () {
    assert.equal(
      micromark('[foo]: /url "title"\n\n![Foo][]'),
      '<p><img src="/url" alt="Foo" title="title" /></p>'
    )
  })

  await t.test(
    'should not support whitespace between sets of brackets',
    async function () {
      assert.equal(
        micromark('[foo]: /url "title"\n\n![foo] \n[]'),
        '<p><img src="/url" alt="foo" title="title" />\n[]</p>'
      )
    }
  )

  await t.test('should support shortcut references (1)', async function () {
    assert.equal(
      micromark('[foo]: /url "title"\n\n![foo]'),
      '<p><img src="/url" alt="foo" title="title" /></p>'
    )
  })

  await t.test('should support shortcut references (2)', async function () {
    assert.equal(
      micromark('[*foo* bar]: /url "title"\n\n![*foo* bar]'),
      '<p><img src="/url" alt="foo bar" title="title" /></p>'
    )
  })

  await t.test(
    'should not support link labels w/ unescaped brackets',
    async function () {
      assert.equal(
        micromark('[[foo]]: /url "title"\n\n![[foo]]'),
        '<p>[[foo]]: /url &quot;title&quot;</p>\n<p>![[foo]]</p>'
      )
    }
  )

  await t.test(
    'should support case-insensitive label matching',
    async function () {
      assert.equal(
        micromark('[foo]: /url "title"\n\n![Foo]'),
        '<p><img src="/url" alt="Foo" title="title" /></p>'
      )
    }
  )

  await t.test(
    'should “support” an escaped bracket instead of an image',
    async function () {
      assert.equal(
        micromark('[foo]: /url "title"\n\n!\\[foo]'),
        '<p>![foo]</p>'
      )
    }
  )

  await t.test(
    'should support an escaped bang instead of an image, but still have a link',
    async function () {
      assert.equal(
        micromark('[foo]: /url "title"\n\n\\![foo]'),
        '<p>!<a href="/url" title="title">foo</a></p>'
      )
    }
  )

  await t.test('should support images w/o destination', async function () {
    // Extra
    assert.equal(micromark('![foo]()'), '<p><img src="" alt="foo" /></p>')
  })

  await t.test(
    'should support images w/ explicit empty destination',
    async function () {
      assert.equal(micromark('![foo](<>)'), '<p><img src="" alt="foo" /></p>')
    }
  )

  await t.test('should support images w/o alt', async function () {
    assert.equal(
      micromark('![](example.png)'),
      '<p><img src="example.png" alt="" /></p>'
    )
  })

  await t.test('should support images w/ empty title (1)', async function () {
    assert.equal(
      micromark('![alpha](bravo.png "")'),
      '<p><img src="bravo.png" alt="alpha" /></p>'
    )
  })

  await t.test('should support images w/ empty title (2)', async function () {
    assert.equal(
      micromark("![alpha](bravo.png '')"),
      '<p><img src="bravo.png" alt="alpha" /></p>'
    )
  })

  await t.test('should support images w/ empty title (3)', async function () {
    assert.equal(
      micromark('![alpha](bravo.png ())'),
      '<p><img src="bravo.png" alt="alpha" /></p>'
    )
  })

  await t.test(
    'should support character references in images',
    async function () {
      assert.equal(
        micromark('![&amp;&copy;&](example.com/&amp;&copy;& "&amp;&copy;&")'),
        '<p><img src="example.com/&amp;%C2%A9&amp;" alt="&amp;©&amp;" title="&amp;©&amp;" /></p>'
      )
    }
  )

  await t.test('should ignore an empty title', async function () {
    // Extra
    // See: <https://github.com/commonmark/commonmark.js/issues/192>
    assert.equal(micromark('![](<> "")'), '<p><img src="" alt="" /></p>')
  })

  await t.test(
    'should support turning off label start (image)',
    async function () {
      assert.equal(
        micromark('![x]()', {
          extensions: [{disable: {null: ['labelStartImage']}}]
        }),
        '<p>!<a href="">x</a></p>'
      )
    }
  )

  await t.test(
    'should ignore non-http protocols by default',
    async function () {
      assert.equal(
        micromark('![](javascript:alert(1))'),
        '<p><img src="" alt="" /></p>'
      )
    }
  )

  await t.test(
    'should allow non-http protocols w/ `allowDangerousProtocol`',
    async function () {
      assert.equal(
        micromark('![](javascript:alert(1))', {allowDangerousProtocol: true}),
        '<p><img src="javascript:alert(1)" alt="" /></p>'
      )
    }
  )
})
