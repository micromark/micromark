import test from 'tape'
import {commonmark} from 'commonmark.json'
import {buffer as micromark} from '../lib/index.js'

const hasOwnProperty = {}.hasOwnProperty

const options = {allowDangerousHtml: true, allowDangerousProtocol: true}

/** @type {Record<string, {input: string, output: string}[]>} */
const sections = {}
let index = -1

while (++index < commonmark.length) {
  const d = commonmark[index]
  const list = sections[d.section] || (sections[d.section] = [])
  list.push({input: d.markdown, output: d.html})
}

test('commonmark', function (t) {
  /** @type {string} */
  let key

  for (key in sections) {
    if (!hasOwnProperty.call(sections, key)) continue

    t.test(key, function (t) {
      let index = -1

      while (++index < sections[key].length) {
        t.equal(
          micromark(sections[key][index].input, options),
          sections[key][index].output
        )
      }

      t.end()
    })
  }

  t.end()
})
