import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

test('text', function () {
  assert.equal(
    micromark("hello $.;'there"),
    "<p>hello $.;'there</p>",
    'should support ascii text'
  )

  assert.equal(
    micromark('Foo χρῆν'),
    '<p>Foo χρῆν</p>',
    'should support unicode text'
  )

  assert.equal(
    micromark('Multiple     spaces'),
    '<p>Multiple     spaces</p>',
    'should preserve internal spaces verbatim'
  )
})
