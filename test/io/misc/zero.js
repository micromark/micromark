import assert from 'node:assert/strict'
import test from 'node:test'
import {micromark} from 'micromark'

// Note: `nul` doesn’t work on Windows as a file name 🤷‍♂️
test('nul', function () {
  assert.equal(
    micromark('asd\0asd'),
    '<p>asd\uFFFDasd</p>',
    'should replace `\\0` w/ a replacement characters (`\uFFFD`)'
  )

  assert.equal(
    micromark('&#0;'),
    '<p>\uFFFD</p>',
    'should replace NUL in a character reference'
  )

  // This doesn’t make sense in MD, as character escapes only work on ascii
  // punctuation, but it’s good to demonstrate the behavior.
  assert.equal(
    micromark('\\0'),
    '<p>\\0</p>',
    'should not support NUL in a character escape'
  )
})
