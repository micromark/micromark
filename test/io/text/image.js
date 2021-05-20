import test from 'tape'
import {buffer as micromark} from '../../../lib/micromark/index.js'

test('image', function (t) {
  t.equal(
    micromark('![foo](/url "title")'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support image w/ resource'
  )

  t.equal(
    micromark('[foo *bar*]: train.jpg "train & tracks"\n\n![foo *bar*]'),
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
    'should support image as shortcut reference'
  )

  t.equal(
    micromark('![foo ![bar](/url)](/url2)'),
    '<p><img src="/url2" alt="foo bar" /></p>',
    'should “support” images in images'
  )

  t.equal(
    micromark('![foo [bar](/url)](/url2)'),
    '<p><img src="/url2" alt="foo bar" /></p>',
    'should “support” links in images'
  )

  t.equal(
    micromark('[foo *bar*]: train.jpg "train & tracks"\n\n![foo *bar*][]'),
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
    'should support “content” in images'
  )

  t.equal(
    micromark('[FOOBAR]: train.jpg "train & tracks"\n\n![foo *bar*][foobar]'),
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
    'should support “content” in images'
  )

  t.equal(
    micromark('![foo](train.jpg)'),
    '<p><img src="train.jpg" alt="foo" /></p>',
    'should support images w/o title'
  )

  t.equal(
    micromark('My ![foo bar](/path/to/train.jpg  "title"   )'),
    '<p>My <img src="/path/to/train.jpg" alt="foo bar" title="title" /></p>',
    'should support images w/ lots of whitespace'
  )

  t.equal(
    micromark('![foo](<url>)'),
    '<p><img src="url" alt="foo" /></p>',
    'should support images w/ enclosed destinations'
  )

  t.equal(
    micromark('![](/url)'),
    '<p><img src="/url" alt="" /></p>',
    'should support images w/ empty labels'
  )

  t.equal(
    micromark('[bar]: /url\n\n![foo][bar]'),
    '<p><img src="/url" alt="foo" /></p>',
    'should support full references (1)'
  )

  t.equal(
    micromark('[BAR]: /url\n\n![foo][bar]'),
    '<p><img src="/url" alt="foo" /></p>',
    'should support full references (2)'
  )

  t.equal(
    micromark('[foo]: /url "title"\n\n![foo][]'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support collapsed references (1)'
  )

  t.equal(
    micromark('[*foo* bar]: /url "title"\n\n![*foo* bar][]'),
    '<p><img src="/url" alt="foo bar" title="title" /></p>',
    'should support collapsed references (2)'
  )

  t.equal(
    micromark('[foo]: /url "title"\n\n![Foo][]'),
    '<p><img src="/url" alt="Foo" title="title" /></p>',
    'should support case-insensitive labels'
  )

  t.equal(
    micromark('[foo]: /url "title"\n\n![foo] \n[]'),
    '<p><img src="/url" alt="foo" title="title" />\n[]</p>',
    'should not support whitespace between sets of brackets'
  )

  t.equal(
    micromark('[foo]: /url "title"\n\n![foo]'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support shortcut references (1)'
  )

  t.equal(
    micromark('[*foo* bar]: /url "title"\n\n![*foo* bar]'),
    '<p><img src="/url" alt="foo bar" title="title" /></p>',
    'should support shortcut references (2)'
  )

  t.equal(
    micromark('[[foo]]: /url "title"\n\n![[foo]]'),
    '<p>[[foo]]: /url &quot;title&quot;</p>\n<p>![[foo]]</p>',
    'should not support link labels w/ unescaped brackets'
  )

  t.equal(
    micromark('[foo]: /url "title"\n\n![Foo]'),
    '<p><img src="/url" alt="Foo" title="title" /></p>',
    'should support case-insensitive label matching'
  )

  t.equal(
    micromark('[foo]: /url "title"\n\n!\\[foo]'),
    '<p>![foo]</p>',
    'should “support” an escaped bracket instead of an image'
  )

  t.equal(
    micromark('[foo]: /url "title"\n\n\\![foo]'),
    '<p>!<a href="/url" title="title">foo</a></p>',
    'should support an escaped bang instead of an image, but still have a link'
  )

  // Extra
  t.equal(
    micromark('![foo]()'),
    '<p><img src="" alt="foo" /></p>',
    'should support images w/o destination'
  )

  t.equal(
    micromark('![foo](<>)'),
    '<p><img src="" alt="foo" /></p>',
    'should support images w/ explicit empty destination'
  )

  t.equal(
    micromark('![](example.png)'),
    '<p><img src="example.png" alt="" /></p>',
    'should support images w/o alt'
  )

  t.equal(
    micromark('![alpha](bravo.png "")'),
    '<p><img src="bravo.png" alt="alpha" /></p>',
    'should support images w/ empty title (1)'
  )

  t.equal(
    micromark("![alpha](bravo.png '')"),
    '<p><img src="bravo.png" alt="alpha" /></p>',
    'should support images w/ empty title (2)'
  )

  t.equal(
    micromark('![alpha](bravo.png ())'),
    '<p><img src="bravo.png" alt="alpha" /></p>',
    'should support images w/ empty title (3)'
  )

  t.equal(
    micromark('![&amp;&copy;&](example.com/&amp;&copy;& "&amp;&copy;&")'),
    '<p><img src="example.com/&amp;%C2%A9&amp;" alt="&amp;©&amp;" title="&amp;©&amp;" /></p>',
    'should support character references in images'
  )

  // Extra
  // See: <https://github.com/commonmark/commonmark.js/issues/192>
  t.equal(
    micromark('![](<> "")'),
    '<p><img src="" alt="" /></p>',
    'should ignore an empty title'
  )

  t.equal(
    micromark('![x]()', {extensions: [{disable: {null: ['labelStartImage']}}]}),
    '<p>!<a href="">x</a></p>',
    'should support turning off label start (image)'
  )

  t.equal(
    micromark('![](javascript:alert(1))'),
    '<p><img src="" alt="" /></p>',
    'should ignore non-http protocols by default'
  )

  t.equal(
    micromark('![](javascript:alert(1))', {allowDangerousProtocol: true}),
    '<p><img src="javascript:alert(1)" alt="" /></p>',
    'should allow non-http protocols w/ `allowDangerousProtocol`'
  )

  t.end()
})
