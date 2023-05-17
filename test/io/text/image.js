import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('image', function () {
  assert.equal(
    micromark('![foo](/url "title")'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support image w/ resource'
  )

  assert.equal(
    micromark('[foo *bar*]: train.jpg "train & tracks"\n\n![foo *bar*]'),
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
    'should support image as shortcut reference'
  )

  assert.equal(
    micromark('![foo ![bar](/url)](/url2)'),
    '<p><img src="/url2" alt="foo bar" /></p>',
    'should “support” images in images'
  )

  assert.equal(
    micromark('![foo [bar](/url)](/url2)'),
    '<p><img src="/url2" alt="foo bar" /></p>',
    'should “support” links in images'
  )

  assert.equal(
    micromark('[foo *bar*]: train.jpg "train & tracks"\n\n![foo *bar*][]'),
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
    'should support “content” in images'
  )

  assert.equal(
    micromark('[FOOBAR]: train.jpg "train & tracks"\n\n![foo *bar*][foobar]'),
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
    'should support “content” in images'
  )

  assert.equal(
    micromark('![foo](train.jpg)'),
    '<p><img src="train.jpg" alt="foo" /></p>',
    'should support images w/o title'
  )

  assert.equal(
    micromark('My ![foo bar](/path/to/train.jpg  "title"   )'),
    '<p>My <img src="/path/to/train.jpg" alt="foo bar" title="title" /></p>',
    'should support images w/ lots of whitespace'
  )

  assert.equal(
    micromark('![foo](<url>)'),
    '<p><img src="url" alt="foo" /></p>',
    'should support images w/ enclosed destinations'
  )

  assert.equal(
    micromark('![](/url)'),
    '<p><img src="/url" alt="" /></p>',
    'should support images w/ empty labels'
  )

  assert.equal(
    micromark('[bar]: /url\n\n![foo][bar]'),
    '<p><img src="/url" alt="foo" /></p>',
    'should support full references (1)'
  )

  assert.equal(
    micromark('[BAR]: /url\n\n![foo][bar]'),
    '<p><img src="/url" alt="foo" /></p>',
    'should support full references (2)'
  )

  assert.equal(
    micromark('[foo]: /url "title"\n\n![foo][]'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support collapsed references (1)'
  )

  assert.equal(
    micromark('[*foo* bar]: /url "title"\n\n![*foo* bar][]'),
    '<p><img src="/url" alt="foo bar" title="title" /></p>',
    'should support collapsed references (2)'
  )

  assert.equal(
    micromark('[foo]: /url "title"\n\n![Foo][]'),
    '<p><img src="/url" alt="Foo" title="title" /></p>',
    'should support case-insensitive labels'
  )

  assert.equal(
    micromark('[foo]: /url "title"\n\n![foo] \n[]'),
    '<p><img src="/url" alt="foo" title="title" />\n[]</p>',
    'should not support whitespace between sets of brackets'
  )

  assert.equal(
    micromark('[foo]: /url "title"\n\n![foo]'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support shortcut references (1)'
  )

  assert.equal(
    micromark('[*foo* bar]: /url "title"\n\n![*foo* bar]'),
    '<p><img src="/url" alt="foo bar" title="title" /></p>',
    'should support shortcut references (2)'
  )

  assert.equal(
    micromark('[[foo]]: /url "title"\n\n![[foo]]'),
    '<p>[[foo]]: /url &quot;title&quot;</p>\n<p>![[foo]]</p>',
    'should not support link labels w/ unescaped brackets'
  )

  assert.equal(
    micromark('[foo]: /url "title"\n\n![Foo]'),
    '<p><img src="/url" alt="Foo" title="title" /></p>',
    'should support case-insensitive label matching'
  )

  assert.equal(
    micromark('[foo]: /url "title"\n\n!\\[foo]'),
    '<p>![foo]</p>',
    'should “support” an escaped bracket instead of an image'
  )

  assert.equal(
    micromark('[foo]: /url "title"\n\n\\![foo]'),
    '<p>!<a href="/url" title="title">foo</a></p>',
    'should support an escaped bang instead of an image, but still have a link'
  )

  // Extra
  assert.equal(
    micromark('![foo]()'),
    '<p><img src="" alt="foo" /></p>',
    'should support images w/o destination'
  )

  assert.equal(
    micromark('![foo](<>)'),
    '<p><img src="" alt="foo" /></p>',
    'should support images w/ explicit empty destination'
  )

  assert.equal(
    micromark('![](example.png)'),
    '<p><img src="example.png" alt="" /></p>',
    'should support images w/o alt'
  )

  assert.equal(
    micromark('![alpha](bravo.png "")'),
    '<p><img src="bravo.png" alt="alpha" /></p>',
    'should support images w/ empty title (1)'
  )

  assert.equal(
    micromark("![alpha](bravo.png '')"),
    '<p><img src="bravo.png" alt="alpha" /></p>',
    'should support images w/ empty title (2)'
  )

  assert.equal(
    micromark('![alpha](bravo.png ())'),
    '<p><img src="bravo.png" alt="alpha" /></p>',
    'should support images w/ empty title (3)'
  )

  assert.equal(
    micromark('![&amp;&copy;&](example.com/&amp;&copy;& "&amp;&copy;&")'),
    '<p><img src="example.com/&amp;%C2%A9&amp;" alt="&amp;©&amp;" title="&amp;©&amp;" /></p>',
    'should support character references in images'
  )

  // Extra
  // See: <https://github.com/commonmark/commonmark.js/issues/192>
  assert.equal(
    micromark('![](<> "")'),
    '<p><img src="" alt="" /></p>',
    'should ignore an empty title'
  )

  assert.equal(
    micromark('![x]()', {extensions: [{disable: {null: ['labelStartImage']}}]}),
    '<p>!<a href="">x</a></p>',
    'should support turning off label start (image)'
  )

  assert.equal(
    micromark('![](javascript:alert(1))'),
    '<p><img src="" alt="" /></p>',
    'should ignore non-http protocols by default'
  )

  assert.equal(
    micromark('![](javascript:alert(1))', {allowDangerousProtocol: true}),
    '<p><img src="javascript:alert(1)" alt="" /></p>',
    'should allow non-http protocols w/ `allowDangerousProtocol`'
  )
})
