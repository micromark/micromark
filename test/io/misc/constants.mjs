import test from 'tape'
import constants from '../../../dist/constant/constants.js'
import htmlRawNames from '../../../dist/constant/html-raw-names.js'
import characterReferences from './character-entities.js'

test('constants', function (t) {
  t.equal(
    constants.asciiAlphaCaseDifference,
    'a'.charCodeAt(0) - 'A'.charCodeAt(0),
    '`asciiAlphaCaseDifference`'
  )

  t.equal(
    constants.characterReferenceDecimalSizeMax,
    (0x10ffff).toString(10).length,
    '`characterReferenceDecimalSizeMax`'
  )

  t.equal(
    constants.characterReferenceHexadecimalSizeMax,
    (0x10ffff).toString(16).length,
    '`characterReferenceHexadecimalSizeMax`'
  )

  t.equal(
    constants.characterReferenceNamedSizeMax,
    longest(Object.keys(characterReferences)).length,
    '`characterReferenceNamedSizeMax`'
  )

  t.equal(
    constants.htmlRawSizeMax,
    longest(htmlRawNames).length,
    '`htmlRawSizeMax`'
  )

  t.end()
})

function longest(list) {
  var index = -1
  var result

  while (++index < list.length) {
    if (!result || list[index].length > result.length) {
      result = list[index]
    }
  }

  return result
}
