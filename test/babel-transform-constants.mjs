import path from 'path'
import test from 'tape'
import babel from '@babel/core'
import transformConstants from '../script/babel-transform-constants.mjs'

function transform(code) {
  return babel.transformSync(code, {
    configFile: false,
    plugins: [transformConstants],
    filename: path.resolve(path.join('test', 'babel-transform-constants.mjs'))
  }).code
}

test('babel-transform-constants', function (t) {
  t.test('cjs', function (t) {
    t.equal(
      transform(
        'var codes = require("../lib/character/codes.js")\nconsole.log(codes.carriageReturn)'
      ),
      'console.log(-5);',
      'should support codes'
    )

    t.equal(
      transform(
        'var values = require("../lib/character/values.js")\nconsole.log(values.ht)'
      ),
      'console.log("\\t");',
      'should support values'
    )

    t.equal(
      transform(
        'var constants = require("../lib/constant/constants.js")\nconsole.log(constants.attentionSideBefore)'
      ),
      'console.log(1);',
      'should support constants'
    )

    t.equal(
      transform(
        'var types = require("../lib/constant/types.js")\nconsole.log(types.data)'
      ),
      'console.log("data");',
      'should support types'
    )

    t.throws(
      function () {
        transform(
          'var codes = require("../lib/character/codes.js")\nconsole.log(codes.missing_field)'
        )
      },
      /Unknown field/,
      'should throw on missing fields'
    )

    t.end()
  })

  t.test('esm', function (t) {
    t.equal(
      transform(
        'import codes from "../lib/character/codes.js"\nconsole.log(codes.carriageReturn)'
      ),
      'console.log(-5);',
      'should support codes'
    )

    t.equal(
      transform(
        'import values from "../lib/character/values.js"\nconsole.log(values.ht)'
      ),
      'console.log("\\t");',
      'should support values'
    )

    t.equal(
      transform(
        'import constants from "../lib/constant/constants.js"\nconsole.log(constants.attentionSideBefore)'
      ),
      'console.log(1);',
      'should support constants'
    )

    t.equal(
      transform(
        'import types from "../lib/constant/types.js"\nconsole.log(types.data)'
      ),
      'console.log("data");',
      'should support types'
    )

    t.throws(
      function () {
        transform(
          'import codes from "../lib/character/codes.js"\nconsole.log(codes.missing_field)'
        )
      },
      /Unknown field/,
      'should throw on missing fields (default export)'
    )

    t.throws(
      function () {
        transform(
          'import {carriageReturn} from "../lib/character/codes.js"\nconsole.log(carriageReturn)'
        )
      },
      /Unknown specifier/,
      'should throw on missing fields (specifier)'
    )

    t.end()
  })

  t.end()
})
