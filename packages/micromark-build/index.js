#!/usr/bin/env node

// A tiny CLI to get (`.d.ts` and) `.js` files from `dev/`, make them ready for
// production, and place them a directory higher.

import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import {transformAsync as babel} from '@babel/core'
import {resolve} from 'import-meta-resolve'
import {glob} from 'glob'

const root = process.cwd()
const files = await glob('./dev/**/*{.d.ts,.js}', {cwd: root})
let index = -1

while (++index < files.length) {
  const input = path.relative(root, files[index])
  const out = input
    .split(path.sep)
    .filter((d) => d !== 'dev')
    .join(path.sep)

  if (out === input) {
    continue
  }

  await fs.mkdir(path.dirname(out), {recursive: true})

  const ext = path.extname(files[index])

  if (ext === '.ts') {
    await fs.copyFile(input, out)
    console.log('%s (from `%s`)', out, input)
    continue
  }

  if (ext !== '.js') {
    throw new Error('Unknown extension `' + ext + '`')
  }

  const base = pathToFileURL(path.resolve(root) + path.sep)
  const modules = [
    'micromark-util-symbol/codes',
    'micromark-util-symbol/constants',
    'micromark-util-symbol/types',
    'micromark-util-symbol/values'
  ]
    .map((d) => {
      try {
        return resolve(d, base.href)
      } catch {}
    })
    .filter(Boolean)

  const result = await babel(String(await fs.readFile(input)), {
    filename: input,
    plugins: [
      [
        'babel-plugin-unassert',
        {
          modules: [
            'assert',
            'devlop',
            'node:assert',
            'node:assert/strict',
            'power-assert',
            'uvu/assert'
          ]
        }
      ],
      'babel-plugin-undebug',
      ['babel-plugin-inline-constants', {modules}]
    ]
  })

  if (!result || !result.code) {
    throw new Error('Could not transform `' + input + '`')
  }

  console.log('%s (from `%s`)', out, input)

  await fs.writeFile(out, result.code)
}
