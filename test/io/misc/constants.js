import test from 'tape'
import {characterEntities} from 'character-entities'
import {htmlRawNames} from 'micromark-util-html-tag-name'
import {constants} from 'micromark-util-symbol/constants.js'

test('constants', function (t) {
  t.equal(
    constants.characterReferenceDecimalSizeMax,
    (0x10_ff_ff).toString(10).length,
    '`characterReferenceDecimalSizeMax`'
  )

  t.equal(
    constants.characterReferenceHexadecimalSizeMax,
    (0x10_ff_ff).toString(16).length,
    '`characterReferenceHexadecimalSizeMax`'
  )

  t.equal(
    constants.characterReferenceNamedSizeMax,
    longest(Object.keys(characterEntities)).length,
    '`characterReferenceNamedSizeMax`'
  )

  t.equal(
    constants.htmlRawSizeMax,
    longest(htmlRawNames).length,
    '`htmlRawSizeMax`'
  )

  t.end()
})

/**
 * @param {string[]} list
 * @returns {string}
 */
function longest(list) {
  let index = -1
  /** @type {string} */
  let result = ''

  while (++index < list.length) {
    if (!result || list[index].length > result.length) {
      result = list[index]
    }
  }

  return result
}
