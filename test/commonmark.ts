'use strict'

import commonmark from 'commonmark.json'
import test from 'tape'
import m from '..'

var options = {
  allowDangerousHtml: true,
  allowDangerousProtocol: true
}

var sections = {}

commonmark.forEach(function (d: any) {
  // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  var list = sections[d.section] || (sections[d.section] = [])
  list.push({input: d.markdown, output: d.html})
})

test('commonmark', function (t: any) {
  Object.keys(sections).forEach(function (name) {
    t.test(name, function (t: any) {
      // @ts-expect-error ts-migrate(7053) FIXME: No index signature with a parameter of type 'strin... Remove this comment to see the full error message
      sections[name].forEach(function (example: any) {
        t.equal(m(example.input, options), example.output)
      })

      t.end()
    })
  })

  t.end()
})
