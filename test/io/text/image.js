'use strict'

var test = require('tape')
var m = require('../../..')

test('image', function (t) {
  t.equal(
    m('![foo](/url "title")'),
    '<p><img src="/url" alt="foo" title="title" /></p>',
    'should support images'
  )

  // t.equal(
  //   m('![foo *bar*]\n\n[foo *bar*]: train.jpg "train & tracks"'),
  //   '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
  //   'should support image as references'
  // )

  // t.equal(
  //   m('![foo ![bar](/url)](/url2)'),
  //   '<p><img src="/url2" alt="foo bar" /></p>',
  //   'should support images (2)'
  // )

  // t.equal(
  //   m('![foo [bar](/url)](/url2)'),
  //   '<p><img src="/url2" alt="foo bar" /></p>',
  //   'should support images (3)'
  // )

  // t.equal(
  //   m('![foo *bar*][]\n\n[foo *bar*]: train.jpg "train & tracks"'),
  //   '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
  //   'should support “content” in images'
  // )

  // t.equal(
  //   m('![foo *bar*][foobar]\n\n[FOOBAR]: train.jpg "train & tracks"'),
  //   '<p><img src="train.jpg" alt="foo bar" title="train &amp; tracks" /></p>',
  //   'should support “content” in images'
  // )

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
    'should support images w/ empty titles'
  )

  // t.equal(
  //   m('![foo][bar]\n\n[bar]: /url'),
  //   '<p><img src="/url" alt="foo" /></p>',
  //   'should support full references (1)'
  // )

  // t.equal(
  //   m('![foo][bar]\n\n[BAR]: /url'),
  //   '<p><img src="/url" alt="foo" /></p>',
  //   'should support full references (2)'
  // )

  // t.equal(
  //   m('![foo][]\n\n[foo]: /url "title"'),
  //   '<p><img src="/url" alt="foo" title="title" /></p>',
  //   'should support collapsed references (1)'
  // )
  //
  // t.equal(
  //   m('![*foo* bar][]\n\n[*foo* bar]: /url "title"'),
  //   '<p><img src="/url" alt="foo bar" title="title" /></p>',
  //   'should support collapsed references (2)'
  // )

  // t.equal(
  //   m('![Foo][]\n\n[foo]: /url "title"'),
  //   '<p><img src="/url" alt="Foo" title="title" /></p>',
  //   'should support case-insensitive labels'
  // )

  // t.equal(
  //   m('![foo] \n[]\n\n[foo]: /url "title"'),
  //   '<p><img src="/url" alt="foo" title="title" />\n[]</p>',
  //   'should not support whitespace between sets of brackets'
  // )

  // t.equal(
  //   m('![foo]\n\n[foo]: /url "title"'),
  //   '<p><img src="/url" alt="foo" title="title" /></p>',
  //   'should support shortcut references (1)'
  // )

  // t.equal(
  //   m('![*foo* bar]\n\n[*foo* bar]: /url "title"'),
  //   '<p><img src="/url" alt="foo bar" title="title" /></p>',
  //   'should support shortcut references (2)'
  // )

  // t.equal(
  //   m('![[foo]]\n\n[[foo]]: /url "title"'),
  //   '<p>![[foo]]</p>\n<p>[[foo]]: /url &quot;title&quot;</p>',
  //   'should not support link labels with unescaped brackets'
  // )

  // t.equal(
  //   m('![Foo]\n\n[foo]: /url "title"'),
  //   '<p><img src="/url" alt="Foo" title="title" /></p>',
  //   'should support case-insensitive label matching'
  // )

  // t.equal(
  //   m('!\\[foo]\n\n[foo]: /url "title"'),
  //   '<p>![foo]</p>',
  //   'should support an escaped brace instead of an image'
  // )

  // t.equal(
  //   m('\\![foo]\n\n[foo]: /url "title"'),
  //   '<p>!<a href="/url" title="title">foo</a></p>',
  //   'should support an escaped bang instead of an image, but still have a link'
  // )

  t.end()
})
