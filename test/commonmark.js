import test from 'tape'
import {commonmark} from 'commonmark.json'
import {buffer as micromark} from '../lib/index.js'

const own = {}.hasOwnProperty

const options = {
  allowDangerousHtml: true,
  allowDangerousProtocol: true
}

const sections = {}
let index = -1
let list
let d

while (++index < commonmark.length) {
  d = commonmark[index]
  list = sections[d.section] || (sections[d.section] = [])
  list.push({input: d.markdown, output: d.html})
}

test('commonmark', function (t) {
  let key

  for (key in sections) {
    if (!own.call(sections, key)) continue

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
