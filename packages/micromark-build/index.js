#!/usr/bin/env node
/**
 * @import {PluginObj} from '@babel/core'
 */

// A tiny CLI to get (`.d.ts` and) `.js` files from `dev/`, make them ready for
// production, and place them a directory higher.

import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import {fileURLToPath, pathToFileURL} from 'node:url'
import {transformAsync as babel} from '@babel/core'
import {glob} from 'glob'
import {resolve} from 'import-meta-resolve'
// @ts-expect-error: untyped.
import RelativizeUrl from 'relativize-url'

const root = pathToFileURL(process.cwd())
const debugConstantPath = pathToFileURL(
  path.join(process.cwd(), 'dev/debug.js')
)
const files = await glob('./dev/**/*{.d.ts.map,.d.ts,.js}', {cwd: root})
let index = -1

while (++index < files.length) {
  const input = new URL(files[index], root + '/')
  if (input.href === debugConstantPath.href) continue

  const output = new URL(input.href.replace(/\/dev\/(?!.*\/dev\/)/, '/'))
  const inputRelative = RelativizeUrl.relativize(input, root)
  const outputRelative = RelativizeUrl.relativize(output, root)

  if (output.href === input.href) {
    continue
  }

  await fs.mkdir(new URL('.', output), {recursive: true})

  const extname = path.extname(fileURLToPath(output))

  if (extname === '.map' || extname === '.ts') {
    await fs.copyFile(input, output)
    console.log('%s (from `%s`)', outputRelative, inputRelative)
    continue
  }

  if (extname !== '.js') {
    throw new Error('Unknown extension `' + extname + '`')
  }

  const modules = ['micromark-util-symbol']
    .map(function (d) {
      try {
        return resolve(d, input.href)
      } catch {}

      return undefined
    })
    .filter(Boolean)

  // Check if ./debug.js file exists before inlining
  try {
    await fs.access(debugConstantPath)
    modules.push(debugConstantPath.href)
  } catch {}

  const result = await babel(await fs.readFile(input, 'utf-8'), {
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
      ['babel-plugin-inline-constants', {modules}],
      'babel-plugin-minify-dead-code-elimination'
    ]
  })

  if (!result || !result.code) {
    throw new Error('Could not transform `' + input + '`')
  }

  console.log('%s (from `%s`)', outputRelative, inputRelative)

  await fs.writeFile(output, result.code)
}
