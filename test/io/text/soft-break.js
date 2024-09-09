import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('soft-break', async function (t) {
  await t.test('should support line endings', async function () {
    assert.equal(micromark('foo\nbaz'), '<p>foo\nbaz</p>')
  })

  await t.test('should trim spaces around line endings', async function () {
    assert.equal(micromark('foo \n baz'), '<p>foo\nbaz</p>')
  })
})
