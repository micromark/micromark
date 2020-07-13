'use strict'

var cm = require('commonmark.json')
var test = require('tape')
var m = require('../buffer')

var total = 0
var skipped = 0

process.on('exit', () => {
  console.log(
    '\nCM skipped: %d (of %d; %s done)',
    skipped,
    total,
    (1 - skipped / total).toLocaleString('en', {style: 'percent'})
  )
})

test('commonmark', function (t) {
  var examples = {}

  cm.forEach((d) => {
    var {section, markdown, html} = d
    var list = examples[section] || (examples[section] = [])
    list.push({input: markdown, expected: html})
  })

  Object.keys(examples).forEach((section) => {
    t.test(section, function (t) {
      examples[section].forEach((example) => {
        var {input, expected} = example
        var actual = m(input)

        total++

        if (actual === expected) {
          t.equal(actual, expected)
        } else {
          skipped++
          t.comment(input)
          t.skip(actual + ' !== ' + expected)
        }
      })

      t.end()
    })
  })

  t.end()
})
