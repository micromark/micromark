import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('dangerous-protocols', async function (t) {
  await t.test('autolink', function () {
    assert.equal(
      micromark('<javascript:alert(1)>'),
      '<p><a href="">javascript:alert(1)</a></p>',
      'should be safe by default'
    )

    assert.equal(
      micromark('<http://a>'),
      '<p><a href="http://a">http://a</a></p>',
      'should allow `http:`'
    )

    assert.equal(
      micromark('<https://a>'),
      '<p><a href="https://a">https://a</a></p>',
      'should allow `https:`'
    )

    assert.equal(
      micromark('<irc:///help>'),
      '<p><a href="irc:///help">irc:///help</a></p>',
      'should allow `irc:`'
    )

    assert.equal(
      micromark('<mailto:a>'),
      '<p><a href="mailto:a">mailto:a</a></p>',
      'should allow `mailto:`'
    )
  })

  await t.test('image', function () {
    assert.equal(
      micromark('![](javascript:alert(1))'),
      '<p><img src="" alt="" /></p>',
      'should be safe by default'
    )

    assert.equal(
      micromark('![](http://a)'),
      '<p><img src="http://a" alt="" /></p>',
      'should allow `http:`'
    )

    assert.equal(
      micromark('![](https://a)'),
      '<p><img src="https://a" alt="" /></p>',
      'should allow `https:`'
    )

    assert.equal(
      micromark('![](irc:///help)'),
      '<p><img src="" alt="" /></p>',
      'should not allow `irc:`'
    )

    assert.equal(
      micromark('![](mailto:a)'),
      '<p><img src="" alt="" /></p>',
      'should not allow `mailto:`'
    )

    assert.equal(
      micromark('![](#a)'),
      '<p><img src="#a" alt="" /></p>',
      'should allow a hash'
    )

    assert.equal(
      micromark('![](?a)'),
      '<p><img src="?a" alt="" /></p>',
      'should allow a search'
    )

    assert.equal(
      micromark('![](/a)'),
      '<p><img src="/a" alt="" /></p>',
      'should allow an absolute'
    )

    assert.equal(
      micromark('![](./a)'),
      '<p><img src="./a" alt="" /></p>',
      'should allow an relative'
    )

    assert.equal(
      micromark('![](../a)'),
      '<p><img src="../a" alt="" /></p>',
      'should allow an upwards relative'
    )

    assert.equal(
      micromark('![](a#b:c)'),
      '<p><img src="a#b:c" alt="" /></p>',
      'should allow a colon in a hash'
    )

    assert.equal(
      micromark('![](a?b:c)'),
      '<p><img src="a?b:c" alt="" /></p>',
      'should allow a colon in a search'
    )

    assert.equal(
      micromark('![](a/b:c)'),
      '<p><img src="a/b:c" alt="" /></p>',
      'should allow a colon in a path'
    )
  })

  await t.test('link', function () {
    assert.equal(
      micromark('[](javascript:alert(1))'),
      '<p><a href=""></a></p>',
      'should be safe by default'
    )

    assert.equal(
      micromark('[](http://a)'),
      '<p><a href="http://a"></a></p>',
      'should allow `http:`'
    )

    assert.equal(
      micromark('[](https://a)'),
      '<p><a href="https://a"></a></p>',
      'should allow `https:`'
    )

    assert.equal(
      micromark('[](irc:///help)'),
      '<p><a href="irc:///help"></a></p>',
      'should allow `irc:`'
    )

    assert.equal(
      micromark('[](mailto:a)'),
      '<p><a href="mailto:a"></a></p>',
      'should allow `mailto:`'
    )

    assert.equal(
      micromark('[](#a)'),
      '<p><a href="#a"></a></p>',
      'should allow a hash'
    )

    assert.equal(
      micromark('[](?a)'),
      '<p><a href="?a"></a></p>',
      'should allow a search'
    )

    assert.equal(
      micromark('[](/a)'),
      '<p><a href="/a"></a></p>',
      'should allow an absolute'
    )

    assert.equal(
      micromark('[](./a)'),
      '<p><a href="./a"></a></p>',
      'should allow an relative'
    )

    assert.equal(
      micromark('[](../a)'),
      '<p><a href="../a"></a></p>',
      'should allow an upwards relative'
    )

    assert.equal(
      micromark('[](a#b:c)'),
      '<p><a href="a#b:c"></a></p>',
      'should allow a colon in a hash'
    )

    assert.equal(
      micromark('[](a?b:c)'),
      '<p><a href="a?b:c"></a></p>',
      'should allow a colon in a search'
    )

    assert.equal(
      micromark('[](a/b:c)'),
      '<p><a href="a/b:c"></a></p>',
      'should allow a colon in a path'
    )
  })
})
