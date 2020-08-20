'use strict'

var commonmark = require('commonmark.json')
var test = require('tape')
var m = require('..')

var options = {
  allowDangerousHtml: true,
  allowDangerousProtocol: true
}

var sections = {}

commonmark.forEach(function (d) {
  var list = sections[d.section] || (sections[d.section] = [])
  list.push({input: d.markdown, output: d.html})
})

test('commonmark', function (t) {
  Object.keys(sections).forEach(function (name) {
    t.test(name, function (t) {
      sections[name].forEach(function (example) {
        t.equal(m(example.input, options), example.output)
      })

      t.end()
    })
  })

  t.end()
})
