import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('text', async function (t) {
  await t.test('should support ascii text', async function () {
    assert.equal(micromark("hello $.;'there"), "<p>hello $.;'there</p>")
  })

  await t.test('should support unicode text', async function () {
    assert.equal(micromark('Foo χρῆν'), '<p>Foo χρῆν</p>')
  })

  await t.test('should preserve internal spaces verbatim', async function () {
    assert.equal(micromark('Multiple     spaces'), '<p>Multiple     spaces</p>')
  })
})
