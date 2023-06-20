import assert from 'node:assert/strict'
import {promises as fs, createReadStream, createWriteStream} from 'node:fs'
import stream from 'node:stream'
import test from 'node:test'
import concatStream from 'concat-stream'
import {stream as micromark} from 'micromark/stream'
import {slowStream} from './util/slow-stream.js'

test('stream', async function (t) {
  await t.test('should support streaming', function () {
    return new Promise(function (resolve) {
      slowStream(
        '`` some code? No, not code! A link though: <http://example.com>'
      )
        .pipe(micromark())
        .pipe(
          concatStream(function (result) {
            assert.equal(
              result,
              '<p>`` some code? No, not code! A link though: <a href="http://example.com">http://example.com</a></p>',
              'pass'
            )

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support streaming typed arrays', function () {
    return new Promise(function (resolve) {
      slowStream(new TextEncoder().encode('<admin@example.com>'))
        .pipe(micromark())
        .pipe(
          concatStream(function (result) {
            assert.equal(
              result,
              '<p><a href="mailto:admin@example.com">admin@example.com</a></p>',
              'pass'
            )

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support reference-first definition-later', function () {
    return new Promise(function (resolve) {
      slowStream('[x]\n\n[x]: y')
        .pipe(micromark())
        .pipe(
          concatStream(function (result) {
            assert.equal(result, '<p><a href="y">x</a></p>\n', 'pass')

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support emphasis and strong', function () {
    return new Promise(function (resolve) {
      slowStream('***x**y**')
        .pipe(micromark())
        .pipe(
          concatStream(function (result) {
            assert.equal(result, '<p><em><strong>x</strong>y</em>*</p>', 'pass')

            resolve(undefined)
          })
        )
    })
  })

  await t.test('should support carriage returns between flow', function () {
    return new Promise(function (resolve) {
      slowStream('***\r\r    fn()\r\r### Heading\r\r')
        .pipe(micromark())
        .pipe(
          concatStream(function (result) {
            assert.equal(
              result,
              '<hr />\r<pre><code>fn()\r</code></pre>\r<h3>Heading</h3>\r',
              'pass'
            )

            resolve(undefined)
          })
        )
    })
  })

  await t.test(
    'should support carriage return + line feeds in flow',
    function () {
      return new Promise(function (resolve) {
        slowStream('***\r\n\r\n    fn()\r\n\r\n### Heading\r\n\r\n')
          .pipe(micromark())
          .pipe(
            concatStream(function (result) {
              assert.equal(
                result,
                '<hr />\r\n<pre><code>fn()\r\n</code></pre>\r\n<h3>Heading</h3>\r\n',
                'pass'
              )

              resolve(undefined)
            })
          )
      })
    }
  )

  await t.test(
    'should integrate w/ `fs.create{Read,Write}Stream`',
    async function () {
      await fs.writeFile('integrate-input', '&because;')

      return new Promise((resolve) => {
        createReadStream('integrate-input')
          .pipe(micromark())
          .pipe(createWriteStream('integrate-output'))
          .on('close', async function () {
            assert.equal(
              String(await fs.readFile('integrate-output')),
              '<p>∵</p>',
              'pass'
            )

            await fs.unlink('integrate-input')
            await fs.unlink('integrate-output')

            resolve(undefined)
          })
      })
    }
  )

  await t.test('should be safe by default', function () {
    return new Promise((resolve) => {
      slowStream('<x>')
        .pipe(micromark())
        .pipe(
          concatStream(function (result) {
            assert.equal(result, '&lt;x&gt;', 'pass')
            resolve(undefined)
          })
        )
    })
  })

  await t.test('should be unsafe w/ `allowDangerousHtml`', function () {
    slowStream('<x>')
      .pipe(micromark({allowDangerousHtml: true}))
      .pipe(
        concatStream(function (result) {
          assert.equal(result, '<x>', 'pass')
        })
      )
  })

  await t.test('should stream in non-UTF8', async function () {
    const encoding = 'utf16le'
    const doc = [
      'A bit of arabic: الإعلان العالمي لحقوق الإنسان',
      'Some hebrew: הכרזה לכל באי עולם בדבר זכויות האדם',
      'Mongolian (Halh, Mongolian script): ᠬᠦᠮᠦᠨ ᠪᠦᠷ ᠲᠥᠷᠥᠵᠦ ᠮᠡᠨᠳᠡᠯᠡᠬᠦ ᠡᠷᠬᠡ ᠴᠢᠯᠥᠭᠡ ᠲᠡᠢ᠂ ᠠᠳᠠᠯᠢᠬᠠᠨ ᠨᠡᠷ',
      'And some happy families: 🎊👩‍👩‍👦‍👦👨‍👨‍👧‍👦🌈'
    ].join('\n')

    await fs.writeFile('non-utf8-input', doc, encoding)

    return new Promise((resolve) => {
      createReadStream('non-utf8-input', {
        encoding,
        highWaterMark: 1
      })
        .pipe(micromark())
        .pipe(createWriteStream('non-utf8-output'))
        .on('close', async function () {
          assert.equal(
            String(await fs.readFile('non-utf8-output')),
            '<p>' + doc + '</p>',
            'pass'
          )

          await fs.unlink('non-utf8-input')
          await fs.unlink('non-utf8-output')

          resolve(undefined)
        })
    })
  })

  await t.test('#end: should return true for `end`', function () {
    assert.equal(micromark().end(), true)
  })

  await t.test('#end: should throw on end after end', function () {
    assert.throws(function () {
      const tr = micromark()
      tr.end()
      tr.end()
    }, /^Error: Did not expect `write` after `end`$/)
  })

  await t.test('#end: should end w/o ever receiving data', async function () {
    await new Promise(function (resolve) {
      const s = micromark()
      s.pipe(
        concatStream(function (value) {
          assert.equal(String(value), '')
          resolve(undefined)
        })
      )
      s.end()
    })
  })

  await t.test('#end: should end', async function () {
    await new Promise(function (resolve) {
      const s = micromark()
      s.pipe(
        concatStream(function (value) {
          assert.equal(String(value), '<p>x</p>')
          resolve(undefined)
        }),
        {end: true}
      )
      s.end('x')
    })
  })

  await t.test('#end: should receive final data from `end`', async function () {
    await new Promise(function (resolve) {
      const s = micromark()
      s.pipe(
        concatStream(function (value) {
          assert.equal(String(value), '<p>alpha</p>')
          resolve(undefined)
        })
      )
      s.end('alpha')
    })
  })

  await t.test('#end: should honour encoding', async function () {
    await new Promise(function (resolve) {
      const s = micromark()
      s.pipe(
        concatStream(function (value) {
          assert.equal(String(value), '<p>abc</p>')
          resolve(undefined)
        })
      )

      // @ts-expect-error Types for `WritableStream#end` are wrong: typed arrays are
      // fine.
      s.end(
        new Uint8Array([0xfe, 0xff, 0x00, 0x61, 0x00, 0x62, 0x00, 0x63]),
        'utf-16be'
      )
    })
  })

  await t.test(
    '#end: should trigger callback and data in the correct order',
    async function () {
      await new Promise(function (resolve) {
        let phase = 0
        const s = micromark()
        s.pipe(
          concatStream(function () {
            assert.equal(phase, 1)
            phase++
            resolve(undefined)
          })
        )
        s.end('charlie', function () {
          assert.equal(phase, 0)
          phase++
        })
      })
    }
  )

  await t.test(
    '#end: should trigger callback when it’s the only argument',
    async function () {
      await new Promise(function (resolve) {
        let phase = 0

        micromark().end(() => {
          phase++
        })

        assert.equal(phase, 1)
        resolve(undefined)
      })
    }
  )

  await t.test('#pipe', function () {
    /** @type {ReturnType<micromark>} */
    let tr

    assert.doesNotThrow(function () {
      // Not writable.
      const tr = micromark()
      // @ts-expect-error Runtime.
      tr.pipe(new stream.Readable())
      tr.end('foo')
    }, 'should not throw when piping to a non-writable stream')

    tr = micromark()
    const s = new stream.PassThrough()
    // @ts-expect-error `std{err,out}` can have this field.
    s._isStdio = true // Act as if we’re stdout.

    tr.pipe(s)

    tr.write('alpha')

    let called = false
    tr.write('bravo', function () {
      called = true
    })

    assert(called, 'should call callbacks')

    tr.end('charlie')

    assert.doesNotThrow(function () {
      s.write('delta')
    }, 'should not `end` stdio streams')

    tr = micromark().on('error', function (/** @type {Error} */ error) {
      assert.equal(error.message, 'Whoops!', 'should pass errors')
    })

    tr.pipe(new stream.PassThrough())
    tr.emit('error', new Error('Whoops!'))

    tr = micromark()
    tr.pipe(new stream.PassThrough())

    assert.throws(
      function () {
        tr.emit('error', new Error('Whoops!'))
      },
      /Whoops!/,
      'should throw if errors are not listened to'
    )

    tr = micromark()

    tr.pipe(
      concatStream(function (buf) {
        assert.equal(
          String(buf),
          '<p>alphabravocharlie</p>',
          'should pipe the processed result'
        )
      })
    ).on('error', function () {
      assert.fail('should not trigger `error`')
    })

    tr.write('alpha')
    tr.write('bravo')
    tr.end('charlie')
  })
})
