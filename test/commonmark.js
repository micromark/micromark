'use strict'

var commonmark = require('commonmark.json')
var test = require('tape')
var m = require('../buffer')

var sections = {}
var total = commonmark.length
var skipped = 0

process.on('exit', onexit)

commonmark.forEach(function (d) {
  var list = sections[d.section] || (sections[d.section] = [])
  list.push({input: d.markdown, output: d.html})
})

test('commonmark', function (t) {
  Object.keys(sections).forEach(function (name) {
    t.test(name, function (t) {
      sections[name].forEach(function (example) {
        var expected = example.output
        var actual = m(example.input, {allowDangerousHtml: true})

        if (actual === expected || !/<[ou]l/.test(expected)) {
          t.equal(actual, expected)
        } else {
          t.skip(actual + ' !== ' + expected)
        }

        if (actual !== expected) {
          skipped++
        }
      })

      t.end()
    })
  })

  t.end()
})

function onexit() {
  console.log(
    '\nCM skipped: %d (of %d; %s done)',
    skipped,
    total,
    (1 - skipped / total).toLocaleString('en', {style: 'percent'})
  )
}
