import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('dangerous-protocols', async function (t) {
  await t.test('autolink', async function (t) {
    await t.test('should be safe by default', async function () {
      assert.equal(
        micromark('<javascript:alert(1)>'),
        '<p><a href="">javascript:alert(1)</a></p>'
      )
    })

    await t.test('should allow `http:`', async function () {
      assert.equal(
        micromark('<http://a>'),
        '<p><a href="http://a">http://a</a></p>'
      )
    })

    await t.test('should allow `https:`', async function () {
      assert.equal(
        micromark('<https://a>'),
        '<p><a href="https://a">https://a</a></p>'
      )
    })

    await t.test('should allow `irc:`', async function () {
      assert.equal(
        micromark('<irc:///help>'),
        '<p><a href="irc:///help">irc:///help</a></p>'
      )
    })

    await t.test('should allow `mailto:`', async function () {
      assert.equal(
        micromark('<mailto:a>'),
        '<p><a href="mailto:a">mailto:a</a></p>'
      )
    })
  })

  await t.test('image', async function (t) {
    await t.test('should be safe by default', async function () {
      assert.equal(
        micromark('![](javascript:alert(1))'),
        '<p><img src="" alt="" /></p>'
      )
    })

    await t.test('should allow `http:`', async function () {
      assert.equal(
        micromark('![](http://a)'),
        '<p><img src="http://a" alt="" /></p>'
      )
    })

    await t.test('should allow `https:`', async function () {
      assert.equal(
        micromark('![](https://a)'),
        '<p><img src="https://a" alt="" /></p>'
      )
    })

    await t.test('should not allow `irc:`', async function () {
      assert.equal(
        micromark('![](irc:///help)'),
        '<p><img src="" alt="" /></p>'
      )
    })

    await t.test('should not allow `mailto:`', async function () {
      assert.equal(micromark('![](mailto:a)'), '<p><img src="" alt="" /></p>')
    })

    await t.test('should allow a hash', async function () {
      assert.equal(micromark('![](#a)'), '<p><img src="#a" alt="" /></p>')
    })

    await t.test('should allow a search', async function () {
      assert.equal(micromark('![](?a)'), '<p><img src="?a" alt="" /></p>')
    })

    await t.test('should allow an absolute', async function () {
      assert.equal(micromark('![](/a)'), '<p><img src="/a" alt="" /></p>')
    })

    await t.test('should allow an relative', async function () {
      assert.equal(micromark('![](./a)'), '<p><img src="./a" alt="" /></p>')
    })

    await t.test('should allow an upwards relative', async function () {
      assert.equal(micromark('![](../a)'), '<p><img src="../a" alt="" /></p>')
    })

    await t.test('should allow a colon in a hash', async function () {
      assert.equal(micromark('![](a#b:c)'), '<p><img src="a#b:c" alt="" /></p>')
    })

    await t.test('should allow a colon in a search', async function () {
      assert.equal(micromark('![](a?b:c)'), '<p><img src="a?b:c" alt="" /></p>')
    })

    await t.test('should allow a colon in a path', async function () {
      assert.equal(micromark('![](a/b:c)'), '<p><img src="a/b:c" alt="" /></p>')
    })
  })

  await t.test('link', async function (t) {
    await t.test('should be safe by default', async function () {
      assert.equal(
        micromark('[](javascript:alert(1))'),
        '<p><a href=""></a></p>'
      )
    })

    await t.test('should allow `http:`', async function () {
      assert.equal(micromark('[](http://a)'), '<p><a href="http://a"></a></p>')
    })

    await t.test('should allow `https:`', async function () {
      assert.equal(
        micromark('[](https://a)'),
        '<p><a href="https://a"></a></p>'
      )
    })

    await t.test('should allow `irc:`', async function () {
      assert.equal(
        micromark('[](irc:///help)'),
        '<p><a href="irc:///help"></a></p>'
      )
    })

    await t.test('should allow `mailto:`', async function () {
      assert.equal(micromark('[](mailto:a)'), '<p><a href="mailto:a"></a></p>')
    })

    await t.test('should allow a hash', async function () {
      assert.equal(micromark('[](#a)'), '<p><a href="#a"></a></p>')
    })

    await t.test('should allow a search', async function () {
      assert.equal(micromark('[](?a)'), '<p><a href="?a"></a></p>')
    })

    await t.test('should allow an absolute', async function () {
      assert.equal(micromark('[](/a)'), '<p><a href="/a"></a></p>')
    })

    await t.test('should allow an relative', async function () {
      assert.equal(micromark('[](./a)'), '<p><a href="./a"></a></p>')
    })

    await t.test('should allow an upwards relative', async function () {
      assert.equal(micromark('[](../a)'), '<p><a href="../a"></a></p>')
    })

    await t.test('should allow a colon in a hash', async function () {
      assert.equal(micromark('[](a#b:c)'), '<p><a href="a#b:c"></a></p>')
    })

    await t.test('should allow a colon in a search', async function () {
      assert.equal(micromark('[](a?b:c)'), '<p><a href="a?b:c"></a></p>')
    })

    await t.test('should allow a colon in a path', async function () {
      assert.equal(micromark('[](a/b:c)'), '<p><a href="a/b:c"></a></p>')
    })
  })
})
