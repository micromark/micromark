import test from 'tape'
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

test('commonmark', function (t) {
  /** @type {string} */
  let key

  for (key in sections) {
    if (!hasOwnProperty.call(sections, key)) continue

    const section = sections[key]
    t.test(key, function (t) {
      let index = -1

      while (++index < section.length) {
        t.equal(micromark(section[index].input, options), section[index].output)
      }

      t.end()
    })
  }

  t.end()
})
