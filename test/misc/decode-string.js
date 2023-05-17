import {decodeString} from 'micromark-util-decode-string'
import test from 'tape'

test('decodeString', function (t) {
  t.equal(
    decodeString('a &asd; b'),
    'a &asd; b',
    'should not decode a non-reference'
  )
  t.equal(
    decodeString('a &#0; b'),
    'a � b',
    'should properly decode dangerous references'
  )
  t.equal(
    decodeString('a &semi; b'),
    'a ; b',
    'should decode a named reference'
  )
  t.equal(
    decodeString('a &#59; b'),
    'a ; b',
    'should decode a decimal reference'
  )
  t.equal(
    decodeString('a &#x3b; b'),
    'a ; b',
    'should decode a hexadecimal reference'
  )
  t.equal(decodeString('a \\a b'), 'a \\a b', 'should not decode a non-escape')
  t.equal(decodeString('a \\; b'), 'a ; b', 'should decode an escape')
  t.equal(decodeString('a ; b'), 'a ; b', 'should decode')
  t.equal(
    decodeString('a \\&semi; b'),
    'a &semi; b',
    'should nout double decode an escaped reference'
  )

  t.end()
})
