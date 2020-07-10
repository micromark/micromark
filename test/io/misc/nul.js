'use strict'

var test = require('tape')
var m = require('../../..')

test('nul', function (t) {
  t.equal(
    m('asd\0asd'),
    '<p>asd�asd</p>',
    'should replace `\\0` with a replacement characters (`�`)'
  )

  t.equal(m('&#0;'), '<p>�</p>', 'should replace NUL in a character reference')

  // This doesn’t make sense in MD, as escapes only work on ASCII punctuation,
  // but it’s good to demonstrate the behavior.
  t.equal(
    m('\\0'),
    '<p>\\0</p>',
    'should not support NUL in a character escape'
  )

  t.end()
})
