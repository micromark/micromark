import assert from 'node:assert/strict'
import test from 'node:test'
import {characterEntities} from 'character-entities'
import {htmlRawNames} from 'micromark-util-html-tag-name'
import {constants} from 'micromark-util-symbol'

test('constants', function () {
  assert.equal(
    constants.characterReferenceDecimalSizeMax,
    (0x10_ff_ff).toString(10).length,
    '`characterReferenceDecimalSizeMax`'
  )

  assert.equal(
    constants.characterReferenceHexadecimalSizeMax,
    (0x10_ff_ff).toString(16).length,
    '`characterReferenceHexadecimalSizeMax`'
  )

  assert.equal(
    constants.characterReferenceNamedSizeMax,
    longest(Object.keys(characterEntities)).length,
    '`characterReferenceNamedSizeMax`'
  )

  assert.equal(
    constants.htmlRawSizeMax,
    longest(htmlRawNames).length,
    '`htmlRawSizeMax`'
  )
})

/**
 * @param {Array<string>} list
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
