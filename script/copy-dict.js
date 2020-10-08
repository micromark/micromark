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
  fs.mkdirSync(path.dirname(distFilePath), {recursive: true}) // Need Node.js 10.12.0+
  fs.copyFileSync(libFilePath, distFilePath)
}

function main() {
  for (var filePath of walk(libDir)) {
    if (filePath.endsWith('.d.ts')) {
      copy(filePath)
    }
  }
}

main()
