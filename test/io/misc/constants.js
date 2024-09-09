import assert from 'node:assert/strict'
import test from 'node:test'
import {characterEntities} from 'character-entities'
import {htmlRawNames} from 'micromark-util-html-tag-name'
import {constants} from 'micromark-util-symbol'

test('constants', async function (t) {
  await t.test('`characterReferenceDecimalSizeMax`', async function () {
    assert.equal(
      constants.characterReferenceDecimalSizeMax,
      (0x10_ff_ff).toString(10).length
    )
  })

  await t.test('`characterReferenceHexadecimalSizeMax`', async function () {
    assert.equal(
      constants.characterReferenceHexadecimalSizeMax,
      (0x10_ff_ff).toString(16).length
    )
  })

  await t.test('`characterReferenceNamedSizeMax`', async function () {
    assert.equal(
      constants.characterReferenceNamedSizeMax,
      longest(Object.keys(characterEntities)).length
    )
  })

  await t.test('`htmlRawSizeMax`', async function () {
    assert.equal(constants.htmlRawSizeMax, longest(htmlRawNames).length)
  })
})

/**
 * @param {ReadonlyArray<string>} list
 *   List of strings.
 * @returns {string}
 *   Longest string.
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
