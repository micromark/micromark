// This script creates an index file for micromark that intercepts micromark’s
// buffering API to capture all passed strings, but otherwise works just like
// micromark.
// Then, it runs the test suite to capture those strings.
// Finally, it writes those given strings to `test/fixtures/` as separate files.
// This can then be used to feed the fuzz tester.

import fs from 'fs'
import cp from 'child_process'

var script = [
  'export default capture',
  'import fs from "fs"',
  'import path from "path"',
  'import {micromark} from "./dist/index.js"',
  'var captured = []',
  'var base = path.join("test", "fixtures")',
  'process.on("exit", onexit)',
  'fs.mkdirSync(base, {recursive: true})',
  'function capture(value) {',
  '  if (typeof value === "string") captured.push(value)',
  '  return m.apply(this, arguments)',
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

fs.renameSync('index.js', 'index.bak.js')
fs.writeFileSync('index.js', script)
cp.execSync('node test/index.js')

process.on('exit', onexit)

function onexit() {
  fs.renameSync('index.bak.js', 'index.js')
}
