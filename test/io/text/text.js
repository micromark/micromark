import {micromark} from 'micromark'
import test from 'tape'

test('text', function (t) {
  t.equal(
    micromark("hello $.;'there"),
    "<p>hello $.;'there</p>",
    'should support ascii text'
  )

  t.equal(
    micromark('Foo χρῆν'),
    '<p>Foo χρῆν</p>',
    'should support unicode text'
  )

  t.equal(
    micromark('Multiple     spaces'),
    '<p>Multiple     spaces</p>',
    'should preserve internal spaces verbatim'
  )

  t.end()
})
