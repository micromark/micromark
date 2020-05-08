'use strict'

var fs = require('fs')
var stream = require('stream')
var test = require('tape')
var concat = require('concat-stream')
var m = require('../../stream')

var PassThrough = stream.PassThrough

test('stream', function (t) {
  t.test('should support streaming', function (t) {
    t.plan(1)

    slowStream(
      '`` some code? No, not code! A link though: <http://example.com>'
    )
      .pipe(m())
      .pipe(concat(onconcat))

    function onconcat(result) {
      t.equal(
        result,
        '<p>`` some code? No, not code! A link though: <a href="http://example.com">http://example.com</a></p>',
        'pass'
      )
    }
  })

  // t.test('should support streaming buffers in non-UTF8', function (t) {
  //   t.plan(1)
  //
  //   slowStream(Buffer.from('bär'), 'hex').pipe(m()).pipe(concat(onconcat))
  //
  //   function onconcat(result) {
  //     t.equal(
  //       result,
  //       '<p><a href="mailto:admin@example.com">admin@example.com</a></p>',
  //       'pass'
  //     )
  //   }
  // })

  t.test('should support streaming buffers', function (t) {
    t.plan(1)

    slowStream(Buffer.from('<admin@example.com>'))
      .pipe(m())
      .pipe(concat(onconcat))

    function onconcat(result) {
      t.equal(
        result,
        '<p><a href="mailto:admin@example.com">admin@example.com</a></p>',
        'pass'
      )
    }
  })

  t.test('should integrate with `fs.create{Read,Write}Stream`', function (t) {
    t.plan(1)

    fs.writeFileSync('integrate-input', '&because;')

    fs.createReadStream('integrate-input')
      .pipe(m())
      .pipe(fs.createWriteStream('integrate-output'))
      .on('close', onend)

    function onend() {
      t.equal(String(fs.readFileSync('integrate-output')), '<p>∵</p>', 'pass')

      fs.unlinkSync('integrate-input')
      fs.unlinkSync('integrate-output')
    }
  })

  t.test('should stream in non-UTF8', function (t) {
    var encoding = 'utf16le'
    var doc = [
      'A bit of arabic: الإعلان العالمي لحقوق الإنسان',
      'Some hebrew: הכרזה לכל באי עולם בדבר זכויות האדם',
      'Mongolian (Halh, Mongolian script): ᠬᠦᠮᠦᠨ ᠪᠦᠷ ᠲᠥᠷᠥᠵᠦ ᠮᠡᠨᠳᠡᠯᠡᠬᠦ ᠡᠷᠬᠡ ᠴᠢᠯᠥᠭᠡ ᠲᠡᠢ᠂ ᠠᠳᠠᠯᠢᠬᠠᠨ ᠨᠡᠷ',
      'And some happy families: 🎊👩‍👩‍👦‍👦👨‍👨‍👧‍👦🌈'
    ].join('\n')

    t.plan(1)

    fs.writeFileSync('non-utf8-input', doc, encoding)

    fs.createReadStream('non-utf8-input', {
      encoding: encoding,
      highWaterMark: 1
    })
      .pipe(m())
      .pipe(fs.createWriteStream('non-utf8-output'))
      .on('close', onend)

    function onend() {
      t.equal(
        String(fs.readFileSync('non-utf8-output')),
        '<p>' + doc + '</p>',
        'pass'
      )

      fs.unlinkSync('non-utf8-input')
      fs.unlinkSync('non-utf8-output')
    }
  })

  t.test('#end and #write', function (t) {
    var s
    var phase

    t.plan(7)

    t.equal(m().end(), true, 'should return true for `end`')

    t.throws(
      function () {
        var tr = m()
        tr.end()
        tr.end()
      },
      /^Error: Did not expect `write` after `end`$/,
      'should throw on end after end'
    )

    s = m()
    s.pipe(
      concat(function (value) {
        t.equal(String(value), '', 'should end without ever receiving data')
      })
    )
    s.end()

    s = m()
    s.pipe(
      concat(function (value) {
        t.equal(
          String(value),
          '<p>alpha</p>',
          'should receive final data from `end`'
        )
      })
    )
    s.end('alpha')

    s = m()
    s.pipe(
      concat(function (value) {
        t.equal(String(value), '<p>brC!vo</p>', 'should honour encoding')
      })
    )
    s.end(Buffer.from([0x62, 0x72, 0xc3, 0xa1, 0x76, 0x6f]), 'ascii')

    phase = 0

    s = m()
    s.pipe(
      concat(function () {
        t.equal(phase, 1, 'should trigger data after callback')
        phase++
      })
    )
    s.end('charlie', function () {
      t.equal(phase, 0, 'should trigger callback before data')
      phase++
    })
  })

  t.test('#pipe', function (st) {
    var tr
    var s

    st.plan(5)

    st.doesNotThrow(function () {
      // Not writable.
      var tr = m()
      tr.pipe(new stream.Readable())
      tr.end('foo')
    }, 'should not throw when piping to a non-writable stream')

    tr = m()
    s = new stream.PassThrough()
    s._isStdio = true

    tr.pipe(s)

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')

    st.doesNotThrow(function () {
      s.write('delta')
    }, 'should not `end` stdio streams')

    tr = m().on('error', function (err) {
      st.equal(err.message, 'Whoops!', 'should pass errors')
    })

    tr.pipe(new stream.PassThrough())
    tr.emit('error', new Error('Whoops!'))

    tr = m()
    tr.pipe(new stream.PassThrough())

    st.throws(
      function () {
        tr.emit('error', new Error('Whoops!'))
      },
      /Whoops!/,
      'should throw if errors are not listened to'
    )

    tr = m()

    tr.pipe(
      concat(function (buf) {
        st.equal(
          String(buf),
          '<p>alphabravocharlie</p>',
          'should pipe the processed result'
        )
      })
    ).on(
      'error',
      /* istanbul ignore next */
      function () {
        st.fail('should not trigger `error`')
      }
    )

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')
  })

  t.end()
})

function slowStream(value, encoding) {
  var stream = new PassThrough()
  var index = 0

  tick()

  return stream

  function send() {
    if (index === value.length) {
      stream.end()
    } else {
      stream.write(value.slice(index, ++index), encoding)
      tick()
    }
  }

  function tick() {
    setTimeout(send, 4)
  }
}
