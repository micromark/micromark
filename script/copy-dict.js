// This script will copy all `.d.ts` files from `lib/` into `dist/`

var fs = require('fs')
var path = require('path')

var rootDir = path.resolve(__dirname, '..')
var distDir = path.join(rootDir, 'dist')
var libDir = path.join(rootDir, 'lib')

function* walk(dir) {
  for (var d of fs.readdirSync(dir)) {
    var entry = path.join(dir, d)
    var stat = fs.lstatSync(entry)
    if (stat.isDirectory()) yield* walk(entry)
    else if (stat.isFile()) yield entry
  }
}

function copy(libFilePath) {
  var distFilePath = path.join(distDir, path.relative(libDir, libFilePath))
  var dir = path.dirname(distFilePath)
  fs.mkdirSync(dir, {recursive: true}) // Need Node.js 10.12.0+

  var inputLines = fs.readFileSync(libFilePath, 'utf-8').split('\n')
  var outputLines = []
  for (var line of inputLines) {
    if (line === '// @for-script: REMOVE_ALL_THING_BELOW') {
      break
    }

    outputLines.push(line)
  }

  fs.writeFileSync(distFilePath, outputLines.join('\n'))
}

function main() {
  for (var filePath of walk(libDir)) {
    if (filePath.endsWith('.d.ts')) {
      copy(filePath)
    }
  }
}

main()
