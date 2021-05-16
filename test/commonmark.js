import test from 'tape'
import {commonmark} from 'commonmark.json'
import {buffer as micromark} from '../lib/index.js'

var own = {}.hasOwnProperty

var options = {
  allowDangerousHtml: true,
  allowDangerousProtocol: true
}

var sections = {}
var index = -1
var list
var d

while (++index < commonmark.length) {
  d = commonmark[index]
  list = sections[d.section] || (sections[d.section] = [])
  list.push({input: d.markdown, output: d.html})
}

test('commonmark', function (t) {
  var key

  for (key in sections) {
    if (!own.call(sections, key)) continue

    t.test(key, function (t) {
      var index = -1

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
