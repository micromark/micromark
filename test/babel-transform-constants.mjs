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
        'var codes = require("../lib/character/codes.mjs")\nconsole.log(codes.carriageReturn)'
      ),
      'console.log(-5);',
      'should support codes'
    )

    t.equal(
      transform(
        'var values = require("../lib/character/values.mjs")\nconsole.log(values.ht)'
      ),
      'console.log("\\t");',
      'should support values'
    )

    t.equal(
      transform(
        'var constants = require("../lib/constant/constants.mjs")\nconsole.log(constants.attentionSideBefore)'
      ),
      'console.log(1);',
      'should support constants'
    )

    t.equal(
      transform(
        'var types = require("../lib/constant/types.mjs")\nconsole.log(types.data)'
      ),
      'console.log("data");',
      'should support types'
    )

    t.throws(
      function () {
        transform(
          'var codes = require("../lib/character/codes.mjs")\nconsole.log(codes.missing_field)'
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
        'import * as codes from "../lib/character/codes.mjs"\nconsole.log(codes.carriageReturn)'
      ),
      'console.log(-5);',
      'should support codes'
    )

    t.equal(
      transform(
        'import * as values from "../lib/character/values.mjs"\nconsole.log(values.ht)'
      ),
      'console.log("\\t");',
      'should support values'
    )

    t.equal(
      transform(
        'import * as constants from "../lib/constant/constants.mjs"\nconsole.log(constants.attentionSideBefore)'
      ),
      'console.log(1);',
      'should support constants'
    )

    t.equal(
      transform(
        'import * as types from "../lib/constant/types.mjs"\nconsole.log(types.data)'
      ),
      'console.log("data");',
      'should support types'
    )

    t.throws(
      function () {
        transform(
          'import * as codes from "../lib/character/codes.mjs"\nconsole.log(codes.missing_field)'
        )
      },
      /Unknown field/,
      'should throw on missing fields (default export)'
    )

    t.throws(
      function () {
        transform(
          'import codes from "../lib/character/codes.mjs"\nconsole.log(codes.carriageReturn)'
        )
      },
      /Unknown specifier/,
      'should throw on missing fields (specifier)'
    )

    t.equal(
      transform(
        'import { EventEmitter } from "events"\nconsole.log(0)'
      ),
      'import { EventEmitter } from "events";\nconsole.log(0);',
      'should support types'
    )


    t.end()
  })

  t.end()
})
