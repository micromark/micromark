#!/usr/bin/env node

// A tiny CLI to get (`.d.ts` and) `.js` files from `dev/`, make them ready for
// production, and place them a directory higher.

import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL, fileURLToPath} from 'node:url'
import {transformAsync as babel} from '@babel/core'
import {resolve} from 'import-meta-resolve'
import {glob} from 'glob'
// @ts-expect-error: intyped.
import RelativizeUrl from 'relativize-url'

const root = pathToFileURL(process.cwd())
const files = await glob('./dev/**/*{.d.ts,.js}', {cwd: root})
let index = -1

while (++index < files.length) {
  const input = new URL(files[index], root + '/')
  const output = new URL(input.href.replace(/\/dev\//, '/'))
  const inputRelative = RelativizeUrl.relativize(input, root)
  const outputRelative = RelativizeUrl.relativize(output, root)

  if (output.href === input.href) {
    continue
  }

  await fs.mkdir(new URL('.', output), {recursive: true})

  const ext = path.extname(fileURLToPath(output))

  if (ext === '.ts') {
    await fs.copyFile(input, output)
    console.log('%s (from `%s`)', outputRelative, inputRelative)
    continue
  }

  if (ext !== '.js') {
    throw new Error('Unknown extension `' + ext + '`')
  }

  const modules = [
    'micromark-util-symbol/codes',
    'micromark-util-symbol/constants',
    'micromark-util-symbol/types',
    'micromark-util-symbol/values'
  ]
    .map((d) => {
      try {
        return resolve(d, input.href)
      } catch {}
    })
    .filter(Boolean)

  const result = await babel(String(await fs.readFile(input)), {
    filename: fileURLToPath(input),
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

  console.log('%s (from `%s`)', outputRelative, inputRelative)

  await fs.writeFile(output, result.code)
}
