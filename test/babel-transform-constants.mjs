import path from 'path'
import test from 'tape'
import babel from '@babel/core'
import transformConstants from '../script/babel-transform-constants.mjs'

function transformCode(code) {
  const result = babel.transformSync(code, {
    configFile: false,
    plugins: [transformConstants],
    filename: path.resolve('test/babel-transform-constants.mjs')
  })
  return result.code
}

test('babel-transform-constants', function (t) {
  t.test('commonjs', function (t) {
    t.test('codes', function (t) {
      t.plan(1)
      var input = `
      var codes = require('../lib/character/codes.js')
      console.log(codes.carriageReturn)
      `
      var output = 'console.log(-5);'
      var result = transformCode(input)
      t.equal(result, output)
    })

    t.test('values', function (t) {
      t.plan(1)
      var input = `
      var values = require('../lib/character/values.js')
      console.log(values.ht)
      `
      var output = 'console.log("\\t");'
      var result = transformCode(input)
      t.equal(result, output)
    })

    t.test('constants', function (t) {
      t.plan(1)
      var input = `
      var constants = require('../lib/constant/constants.js')
      console.log(constants.attentionSideBefore)
      `
      var output = 'console.log(1);'
      var result = transformCode(input)
      t.equal(result, output)
    })

    t.test('types', function (t) {
      t.plan(1)
      var input = `
      var types = require('../lib/constant/types.js')
      console.log(types.data)
      `
      var output = 'console.log("data");'
      var result = transformCode(input)
      t.equal(result, output)
    })

    t.test('codes', function (t) {
      t.plan(1)
      var input = `
      var codes = require('../lib/character/codes.js')
      console.log(codes.missing_field)
      `
      var output = ''
      t.throws(function () {
        transformCode(input)
      }, /Unknown field/)
    })
    t.end()
  })

  t.test('es modules', function (t) {
    t.test('codes', function (t) {
      t.plan(1)
      var input = `
      import codes from '../lib/character/codes.js'
      console.log(codes.carriageReturn)
      `
      var output = 'console.log(-5);'
      var result = transformCode(input)
      t.equal(result, output)
    })

    t.test('values', function (t) {
      t.plan(1)
      var input = `
      import values from '../lib/character/values.js'
      console.log(values.ht)
      `
      var output = 'console.log("\\t");'
      var result = transformCode(input)
      t.equal(result, output)
    })

    t.test('constants', function (t) {
      t.plan(1)
      var input = `
      import constants from '../lib/constant/constants.js'
      console.log(constants.attentionSideBefore)
      `
      var output = 'console.log(1);'
      var result = transformCode(input)
      t.equal(result, output)
    })

    t.test('types', function (t) {
      t.plan(1)
      var input = `
      import types from '../lib/constant/types.js'
      console.log(types.data)
      `
      var output = 'console.log("data");'
      var result = transformCode(input)
      t.equal(result, output)
    })

    t.test('codes', function (t) {
      t.plan(1)
      var input = `
      import codes from '../lib/character/codes.js'
      console.log(codes.missing_field)
      `
      var output = ''
      t.throws(function () {
        transformCode(input)
      }, /Unknown field/)
    })

    t.test('codes', function (t) {
      t.plan(1)
      var input = `
      import {carriageReturn} from '../lib/character/codes.js'
      console.log(codes.carriageReturn)
      `
      var output = ''
      t.throws(function () {
        transformCode(input)
      }, /Unknown specifier/)
    })
    t.end()
  })
  t.end()
})
