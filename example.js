var Micromark = require('.')

var m = new Micromark()

var res = m.write('# Hello!')

console.log('res: ', res)
