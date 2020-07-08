var fs = require('fs')
var m = require('.')

var doc = String(fs.readFileSync('example.md'))

var result = m(doc)
process.stdout.write('result:>>>' + result + '<<<', () => {})
