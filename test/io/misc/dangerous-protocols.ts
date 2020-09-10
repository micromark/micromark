'use strict'

import test from 'tape'
import m from '../../..'

test('dangerous-protocols', function (t: any) {
  t.test('autolink', function (t: any) {
    t.equal(
      m('<javascript:alert(1)>'),
      '<p><a href="">javascript:alert(1)</a></p>',
      'should be safe by default'
    )

    t.equal(
      m('<http://a>'),
      '<p><a href="http://a">http://a</a></p>',
      'should allow `http:`'
    )

    t.equal(
      m('<https://a>'),
      '<p><a href="https://a">https://a</a></p>',
      'should allow `https:`'
    )

    t.equal(
      m('<irc:///help>'),
      '<p><a href="irc:///help">irc:///help</a></p>',
      'should allow `irc:`'
    )

    t.equal(
      m('<mailto:a>'),
      '<p><a href="mailto:a">mailto:a</a></p>',
      'should allow `mailto:`'
    )

    t.end()
  })

  t.test('image', function (t: any) {
    t.equal(
      m('![](javascript:alert(1))'),
      '<p><img src="" alt="" /></p>',
      'should be safe by default'
    )

    t.equal(
      m('![](http://a)'),
      '<p><img src="http://a" alt="" /></p>',
      'should allow `http:`'
    )

    t.equal(
      m('![](https://a)'),
      '<p><img src="https://a" alt="" /></p>',
      'should allow `https:`'
    )

    t.equal(
      m('![](irc:///help)'),
      '<p><img src="" alt="" /></p>',
      'should not allow `irc:`'
    )

    t.equal(
      m('![](mailto:a)'),
      '<p><img src="" alt="" /></p>',
      'should not allow `mailto:`'
    )

    t.equal(
      m('![](#a)'),
      '<p><img src="#a" alt="" /></p>',
      'should allow a hash'
    )

    t.equal(
      m('![](?a)'),
      '<p><img src="?a" alt="" /></p>',
      'should allow a search'
    )

    t.equal(
      m('![](/a)'),
      '<p><img src="/a" alt="" /></p>',
      'should allow an absolute'
    )

    t.equal(
      m('![](./a)'),
      '<p><img src="./a" alt="" /></p>',
      'should allow an relative'
    )

    t.equal(
      m('![](../a)'),
      '<p><img src="../a" alt="" /></p>',
      'should allow an upwards relative'
    )

    t.equal(
      m('![](a#b:c)'),
      '<p><img src="a#b:c" alt="" /></p>',
      'should allow a colon in a hash'
    )

    t.equal(
      m('![](a?b:c)'),
      '<p><img src="a?b:c" alt="" /></p>',
      'should allow a colon in a search'
    )

    t.equal(
      m('![](a/b:c)'),
      '<p><img src="a/b:c" alt="" /></p>',
      'should allow a colon in a path'
    )

    t.end()
  })

  t.test('link', function (t: any) {
    t.equal(
      m('[](javascript:alert(1))'),
      '<p><a href=""></a></p>',
      'should be safe by default'
    )

    t.equal(
      m('[](http://a)'),
      '<p><a href="http://a"></a></p>',
      'should allow `http:`'
    )

    t.equal(
      m('[](https://a)'),
      '<p><a href="https://a"></a></p>',
      'should allow `https:`'
    )

    t.equal(
      m('[](irc:///help)'),
      '<p><a href="irc:///help"></a></p>',
      'should allow `irc:`'
    )

    t.equal(
      m('[](mailto:a)'),
      '<p><a href="mailto:a"></a></p>',
      'should allow `mailto:`'
    )

    t.equal(m('[](#a)'), '<p><a href="#a"></a></p>', 'should allow a hash')

    t.equal(m('[](?a)'), '<p><a href="?a"></a></p>', 'should allow a search')

    t.equal(m('[](/a)'), '<p><a href="/a"></a></p>', 'should allow an absolute')

    t.equal(
      m('[](./a)'),
      '<p><a href="./a"></a></p>',
      'should allow an relative'
    )

    t.equal(
      m('[](../a)'),
      '<p><a href="../a"></a></p>',
      'should allow an upwards relative'
    )

    t.equal(
      m('[](a#b:c)'),
      '<p><a href="a#b:c"></a></p>',
      'should allow a colon in a hash'
    )

    t.equal(
      m('[](a?b:c)'),
      '<p><a href="a?b:c"></a></p>',
      'should allow a colon in a search'
    )

    t.equal(
      m('[](a/b:c)'),
      '<p><a href="a/b:c"></a></p>',
      'should allow a colon in a path'
    )

    t.end()
  })

  t.end()
})
