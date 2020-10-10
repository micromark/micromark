// This file is for https://github.com/microsoft/dtslint .
// Tests are type-checked, but not run.

import micromarkBuffer from 'micromark'
import micromarkStream from 'micromark/stream'

function testBuffer() {
  const raw = '# text **strong**'

  // $ExpectType string
  micromarkBuffer(raw)

  // $ExpectType string
  micromarkBuffer(raw, {
    defaultLineEnding: '\r\n',
    allowDangerousHtml: true,
    allowDangerousProtocol: true,
    extensions: [],
    htmlExtensions: []
  })

  // $ExpectType string
  micromarkBuffer(raw, {allowDangerousHtml: true})

  // $ExpectType string
  micromarkBuffer(Buffer.alloc(8), {allowDangerousHtml: true})

  // $ExpectError
  micromarkBuffer(Buffer.alloc(8), 'utf-8888', {allowDangerousHtml: true})

  // $ExpectError
  micromarkBuffer(1234, {allowDangerousHtml: true})

  // $ExpectError
  micromarkBuffer(raw, 'utf8', {this_is_not_a_valid_option: 0})

  // $ExpectError
  micromarkBuffer(raw, 'utf8', 'this_is_not_a_valid_option')

  // $ExpectError
  micromarkBuffer(Buffer.alloc(8), 'utf-8', {}, 'too_many_arguments')
}

function testStream() {
  // $ExpectType EventEmitter
  micromarkStream({
    defaultLineEnding: '\n',
    allowDangerousHtml: true,
    allowDangerousProtocol: true,
    extensions: [],
    htmlExtensions: []
  })
}

function main() {
  testBuffer()
  testStream()
}

main()
