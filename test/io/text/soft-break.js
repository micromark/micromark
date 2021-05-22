import test from 'tape'
import {micromark} from 'micromark'

test('soft-break', function (t) {
  t.equal(
    micromark('foo\nbaz'),
    '<p>foo\nbaz</p>',
    'should support line endings'
  )

  t.equal(
    micromark('foo \n baz'),
    '<p>foo\nbaz</p>',
    'should trim spaces around line endings'
  )

  t.end()
})
