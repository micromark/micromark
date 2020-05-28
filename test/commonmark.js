'use strict'

var cm = require('commonmark.json')
var test = require('tape')
var m = require('../buffer')

var skipped = 0

process.on('exit', () => {
  console.log('\nCM skipped: %d', skipped)
})

test('commonmark', function (t) {
  var examples = cm.reduce((all, d) => {
    var {section, markdown, html} = d
    var list = all[section] || (all[section] = [])
    // To do: paragraph whitespace:
    list.push({
      input: markdown.replace(/\n$/, ''),
      expected: html.replace(/\n$/, '')
    })
    return all
  }, {})

  Object.keys(examples).forEach((section) => {
    t.test(section, function (t) {
      examples[section].forEach((example) => {
        var {input, expected} = example
        var actual = m(input)

        if (actual === expected) {
          t.equal(actual, expected)
        } else {
          skipped++
          t.skip(actual + ' !== ' + expected)
        }
      })

      t.end()
    })
  })

  t.end()
})
