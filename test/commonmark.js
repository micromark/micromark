import assert from 'node:assert/strict'
import test from 'node:test'
import {commonmark} from 'commonmark.json'
import {micromark} from 'micromark'

const hasOwnProperty = {}.hasOwnProperty

const options = {allowDangerousHtml: true, allowDangerousProtocol: true}

/** @type {Record<string, Array<{input: string, output: string}>>} */
const sections = {}
let index = -1

while (++index < commonmark.length) {
  const d = commonmark[index]
  const list = sections[d.section] || (sections[d.section] = [])
  list.push({input: d.markdown, output: d.html})
}

test('commonmark', function () {
  /** @type {string} */
  let key

  for (key in sections) {
    if (!hasOwnProperty.call(sections, key)) continue

    const section = sections[key]
    let index = -1

    while (++index < section.length) {
      assert.equal(
        micromark(section[index].input, options),
        section[index].output
      )
    }
  }
})
