// This script creates an index file for micromark that intercepts micromark’s
// buffering API to capture all passed strings, but otherwise works just like
// micromark.
// Then, it runs the test suite to capture those strings.
// Finally, it writes those given strings to `test/fixtures/` as separate files.
// This can then be used to feed the fuzz tester.

import {promises as fs} from 'fs'
import path from 'path'
import cp from 'child_process'

main()

async function main() {
  await fs.rename(
    path.join('packages', 'micromark', 'index.js'),
    path.join('packages', 'micromark', 'index.bak.js')
  )
  await fs.writeFile(
    path.join('packages', 'micromark', 'index.js'),
    [
      'export {micromark}',
      'import fs from "fs"',
      'import path from "path"',
      'import {micromark as core} from "./index.bak.js"',
      'const captured = []',
      'const base = path.join("test", "fixtures")',
      'process.on("exit", onexit)',
      'fs.mkdirSync(base, {recursive: true})',
      'function micromark(value) {',
      '  console.log(...arguments)',
      '  if (typeof value === "string") captured.push(value)',
      '  return core(...arguments)',
      '}',
      'function onexit() {',
      '  captured',
      '    .sort()',
      '    .filter((d, i, a) => a.indexOf(d) === i)',
      '    .forEach((d, i) => fs.writeFileSync(',
      '      path.join(base, String(i)),',
      '      d',
      '    ))',
      '}'
    ].join('\n')
  )

  cp.execSync('node test/index.js')

  process.on('exit', onexit)

  async function onexit() {
    await fs.rename(
      path.join('packages', 'micromark', 'index.bak.js'),
      path.join('packages', 'micromark', 'index.js')
    )
  }
}
