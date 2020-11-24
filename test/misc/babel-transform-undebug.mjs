import path from 'path'
import test from 'tape'
import babel from '@babel/core'
import transformConstants from '../../script/babel-transform-undebug.mjs'

function transform(code) {
  return babel.transformSync(code, {
    configFile: false,
    plugins: [transformConstants],
    filename: path.resolve(path.join('test', 'babel-transform-undebug.mjs'))
  }).code
}

test('babel-transform-undebug', function (t) {
  t.equal(
    transform(
      'var debug = require("debug")("micromark")\ndebug("log")\nconsole.log("log")'
    ),
    'console.log("log");',
    'should compile require and debug calls away'
  )

  t.equal(
    transform(
      'import createDebug from "debug"\nvar debug = createDebug("micromark")\ndebug("log")\nconsole.log("log")'
    ),
    'console.log("log");',
    'should compile import and debug calls away'
  )

  t.end()
})
