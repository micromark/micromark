import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('soft-break', function () {
  assert.equal(
    micromark('foo\nbaz'),
    '<p>foo\nbaz</p>',
    'should support line endings'
  )

  assert.equal(
    micromark('foo \n baz'),
    '<p>foo\nbaz</p>',
    'should trim spaces around line endings'
  )
})
