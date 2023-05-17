import {micromark} from 'micromark'
import test from 'tape'

test('dangerous-protocols', function (t) {
  t.test('autolink', function (t) {
    t.equal(
      micromark('<javascript:alert(1)>'),
      '<p><a href="">javascript:alert(1)</a></p>',
      'should be safe by default'
    )

    t.equal(
      micromark('<http://a>'),
      '<p><a href="http://a">http://a</a></p>',
      'should allow `http:`'
    )

    t.equal(
      micromark('<https://a>'),
      '<p><a href="https://a">https://a</a></p>',
      'should allow `https:`'
    )

    t.equal(
      micromark('<irc:///help>'),
      '<p><a href="irc:///help">irc:///help</a></p>',
      'should allow `irc:`'
    )

    t.equal(
      micromark('<mailto:a>'),
      '<p><a href="mailto:a">mailto:a</a></p>',
      'should allow `mailto:`'
    )

    t.end()
  })

  t.test('image', function (t) {
    t.equal(
      micromark('![](javascript:alert(1))'),
      '<p><img src="" alt="" /></p>',
      'should be safe by default'
    )

    t.equal(
      micromark('![](http://a)'),
      '<p><img src="http://a" alt="" /></p>',
      'should allow `http:`'
    )

    t.equal(
      micromark('![](https://a)'),
      '<p><img src="https://a" alt="" /></p>',
      'should allow `https:`'
    )

    t.equal(
      micromark('![](irc:///help)'),
      '<p><img src="" alt="" /></p>',
      'should not allow `irc:`'
    )

    t.equal(
      micromark('![](mailto:a)'),
      '<p><img src="" alt="" /></p>',
      'should not allow `mailto:`'
    )

    t.equal(
      micromark('![](#a)'),
      '<p><img src="#a" alt="" /></p>',
      'should allow a hash'
    )

    t.equal(
      micromark('![](?a)'),
      '<p><img src="?a" alt="" /></p>',
      'should allow a search'
    )

    t.equal(
      micromark('![](/a)'),
      '<p><img src="/a" alt="" /></p>',
      'should allow an absolute'
    )

    t.equal(
      micromark('![](./a)'),
      '<p><img src="./a" alt="" /></p>',
      'should allow an relative'
    )

    t.equal(
      micromark('![](../a)'),
      '<p><img src="../a" alt="" /></p>',
      'should allow an upwards relative'
    )

    t.equal(
      micromark('![](a#b:c)'),
      '<p><img src="a#b:c" alt="" /></p>',
      'should allow a colon in a hash'
    )

    t.equal(
      micromark('![](a?b:c)'),
      '<p><img src="a?b:c" alt="" /></p>',
      'should allow a colon in a search'
    )

    t.equal(
      micromark('![](a/b:c)'),
      '<p><img src="a/b:c" alt="" /></p>',
      'should allow a colon in a path'
    )

    t.end()
  })

  t.test('link', function (t) {
    t.equal(
      micromark('[](javascript:alert(1))'),
      '<p><a href=""></a></p>',
      'should be safe by default'
    )

    t.equal(
      micromark('[](http://a)'),
      '<p><a href="http://a"></a></p>',
      'should allow `http:`'
    )

    t.equal(
      micromark('[](https://a)'),
      '<p><a href="https://a"></a></p>',
      'should allow `https:`'
    )

    t.equal(
      micromark('[](irc:///help)'),
      '<p><a href="irc:///help"></a></p>',
      'should allow `irc:`'
    )

    t.equal(
      micromark('[](mailto:a)'),
      '<p><a href="mailto:a"></a></p>',
      'should allow `mailto:`'
    )

    t.equal(
      micromark('[](#a)'),
      '<p><a href="#a"></a></p>',
      'should allow a hash'
    )

    t.equal(
      micromark('[](?a)'),
      '<p><a href="?a"></a></p>',
      'should allow a search'
    )

    t.equal(
      micromark('[](/a)'),
      '<p><a href="/a"></a></p>',
      'should allow an absolute'
    )

    t.equal(
      micromark('[](./a)'),
      '<p><a href="./a"></a></p>',
      'should allow an relative'
    )

    t.equal(
      micromark('[](../a)'),
      '<p><a href="../a"></a></p>',
      'should allow an upwards relative'
    )

    t.equal(
      micromark('[](a#b:c)'),
      '<p><a href="a#b:c"></a></p>',
      'should allow a colon in a hash'
    )

    t.equal(
      micromark('[](a?b:c)'),
      '<p><a href="a?b:c"></a></p>',
      'should allow a colon in a search'
    )

    t.equal(
      micromark('[](a/b:c)'),
      '<p><a href="a/b:c"></a></p>',
      'should allow a colon in a path'
    )

    t.end()
  })

  t.end()
})
