import test from 'tape'
import {micromark} from 'micromark'

// Note: `nul` doesn’t work on Windows as a file name 🤷‍♂️
test('nul', function (t) {
  t.equal(
    micromark('asd\0asd'),
    '<p>asd�asd</p>',
    'should replace `\\0` w/ a replacement characters (`�`)'
  )

  t.equal(
    micromark('&#0;'),
    '<p>�</p>',
    'should replace NUL in a character reference'
  )

  // This doesn’t make sense in MD, as character escapes only work on ascii
  // punctuation, but it’s good to demonstrate the behavior.
  t.equal(
    micromark('\\0'),
    '<p>\\0</p>',
    'should not support NUL in a character escape'
  )

  t.end()
})
