'use strict'

var PassThrough = require('stream').PassThrough
var test = require('tape')
var concat = require('concat-stream')
var m = require('../..')

test('stream', function (t) {
  var stream = new PassThrough()
  var value = '`` some code? No, not code! A link though: <http://example.com>'
  var index = 0

  t.plan(1)

  stream.pipe(m.createStream()).pipe(concat(done))

  send()

  function send() {
    if (index === value.length) {
      stream.end()
    } else {
      stream.write(value.charAt(index++))
      setTimeout(send, 4)
    }
  }

  function done(buf) {
    t.equal(
      String(buf),
      '<p>`` some code? No, not code! A link though: <a href="http://example.com">http://example.com</a></p>',
      'should support streaming'
    )
  }
})
