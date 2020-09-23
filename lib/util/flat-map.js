module.exports = flatMap

var chunkedSplice = require('./chunked-splice')

// Note: `a` could be given here, which is then passed to the map function.
// It functions as a rest/spread, but smaller.
function flatMap(array, map, a) {
  var length = array.length
  var index = -1
  var result = []

  while (++index < length) {
    chunkedSplice(result, result.length, 0, map(array[index], a))
  }

  return result
}
