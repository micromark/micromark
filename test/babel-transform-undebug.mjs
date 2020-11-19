import path from 'path'
import test from 'tape'
import babel from '@babel/core'
import transformConstants from '../script/babel-transform-undebug.mjs'

function transformCode(code) {
  const result = babel.transformSync(code, {
    plugins: [transformConstants],
    filename: path.resolve('test/babel-transform-undebug.mjs')
  })
  return result.code
}

test('babel-transform-undebug', function (t) {
  t.test('commonjs', function (t) {
    t.test('codes', function (t) {
      t.plan(1)
      var input = `
      var debug = require('debug')('micromark')
      debug('log')
      console.log('log')
      `
      var output = 'console.log(\'log\');'
      var result = transformCode(input)
      t.equal(result, output)
    })
    t.end()
  })

  t.test('es modules', function (t) {
    t.test('codes', function (t) {
      t.plan(1)
      var input = `
      import createDebug from 'debug'
      var debug = createDebug('micromark')
      debug('log')
      console.log(\'log\')
      `
      var output = 'console.log(\'log\');'
      var result = transformCode(input)
      t.equal(result, output)
    })
    t.end()
  })
  t.end()
})
