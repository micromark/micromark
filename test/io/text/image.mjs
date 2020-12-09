import test from 'tape'
import m from '../../../lib/index.mjs'

test('image', function (t) {
  t.equal(
    m('![foo](/url "title")'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support image w/ resource'
  )

  t.equal(
    m('[foo *bar*]: train.jpg "train & tracks"\n\n![foo *bar*]'),
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
    'should support image as shortcut reference'
  )

  t.equal(
    m('![foo ![bar](/url)](/url2)'),
    '<p><img src="/url2" alt="foo bar" /></p>',
    'should “support” images in images'
  )

  t.equal(
    m('![foo [bar](/url)](/url2)'),
    '<p><img src="/url2" alt="foo bar" /></p>',
    'should “support” links in images'
  )

  t.equal(
    m('[foo *bar*]: train.jpg "train & tracks"\n\n![foo *bar*][]'),
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
    'should support “content” in images'
  )

  t.equal(
    m('[FOOBAR]: train.jpg "train & tracks"\n\n![foo *bar*][foobar]'),
    '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
    'should support “content” in images'
  )

  t.equal(
    m('![foo](train.jpg)'),
    '<p><img src="train.jpg" alt="foo" /></p>',
    'should support images w/o title'
  )

  t.equal(
    m('My ![foo bar](/path/to/train.jpg  "title"   )'),
    '<p>My <img src="/path/to/train.jpg" alt="foo bar" title="title" /></p>',
    'should support images w/ lots of whitespace'
  )

  t.equal(
    m('![foo](<url>)'),
    '<p><img src="url" alt="foo" /></p>',
    'should support images w/ enclosed destinations'
  )

  t.equal(
    m('![](/url)'),
    '<p><img src="/url" alt="" /></p>',
    'should support images w/ empty labels'
  )

  t.equal(
    m('[bar]: /url\n\n![foo][bar]'),
    '<p><img src="/url" alt="foo" /></p>',
    'should support full references (1)'
  )

  t.equal(
    m('[BAR]: /url\n\n![foo][bar]'),
    '<p><img src="/url" alt="foo" /></p>',
    'should support full references (2)'
  )

  t.equal(
    m('[foo]: /url "title"\n\n![foo][]'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support collapsed references (1)'
  )

  t.equal(
    m('[*foo* bar]: /url "title"\n\n![*foo* bar][]'),
    '<p><img src="/url" alt="foo bar" title="title" /></p>',
    'should support collapsed references (2)'
  )

  t.equal(
    m('[foo]: /url "title"\n\n![Foo][]'),
    '<p><img src="/url" alt="Foo" title="title" /></p>',
    'should support case-insensitive labels'
  )

  t.equal(
    m('[foo]: /url "title"\n\n![foo] \n[]'),
    '<p><img src="/url" alt="foo" title="title" />\n[]</p>',
    'should not support whitespace between sets of brackets'
  )

  t.equal(
    m('[foo]: /url "title"\n\n![foo]'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support shortcut references (1)'
  )

  t.equal(
    m('[*foo* bar]: /url "title"\n\n![*foo* bar]'),
    '<p><img src="/url" alt="foo bar" title="title" /></p>',
    'should support shortcut references (2)'
  )

  t.equal(
    m('[[foo]]: /url "title"\n\n![[foo]]'),
    '<p>[[foo]]: /url &quot;title&quot;</p>\n<p>![[foo]]</p>',
    'should not support link labels w/ unescaped brackets'
  )

  t.equal(
    m('[foo]: /url "title"\n\n![Foo]'),
    '<p><img src="/url" alt="Foo" title="title" /></p>',
    'should support case-insensitive label matching'
  )

  t.equal(
    m('[foo]: /url "title"\n\n!\\[foo]'),
    '<p>![foo]</p>',
    'should “support” an escaped bracket instead of an image'
  )

  t.equal(
    m('[foo]: /url "title"\n\n\\![foo]'),
    '<p>!<a href="/url" title="title">foo</a></p>',
    'should support an escaped bang instead of an image, but still have a link'
  )

  // Extra
  t.equal(
    m('![foo]()'),
    '<p><img src="" alt="foo" /></p>',
    'should support images w/o destination'
  )

  t.equal(
    m('![foo](<>)'),
    '<p><img src="" alt="foo" /></p>',
    'should support images w/ explicit empty destination'
  )

  t.equal(
    m('![](example.png)'),
    '<p><img src="example.png" alt="" /></p>',
    'should support images w/o alt'
  )

  t.equal(
    m('![alpha](bravo.png "")'),
    '<p><img src="bravo.png" alt="alpha" /></p>',
    'should support images w/ empty title (1)'
  )

  t.equal(
    m("![alpha](bravo.png '')"),
    '<p><img src="bravo.png" alt="alpha" /></p>',
    'should support images w/ empty title (2)'
  )

  t.equal(
    m('![alpha](bravo.png ())'),
    '<p><img src="bravo.png" alt="alpha" /></p>',
    'should support images w/ empty title (3)'
  )

  t.equal(
    m('![&amp;&copy;&](example.com/&amp;&copy;& "&amp;&copy;&")'),
    '<p><img src="example.com/&amp;%C2%A9&amp;" alt="&amp;©&amp;" title="&amp;©&amp;" /></p>',
    'should support character references in images'
  )

  // Extra
  // See: <https://github.com/commonmark/commonmark.js/issues/192>
  t.equal(
    m('![](<> "")'),
    '<p><img src="" alt="" /></p>',
    'should ignore an empty title'
  )

  t.equal(
    m('![x]()', {extensions: [{disable: {null: ['labelStartImage']}}]}),
    '<p>!<a href="">x</a></p>',
    'should support turning off label start (image)'
  )

  t.end()
})
