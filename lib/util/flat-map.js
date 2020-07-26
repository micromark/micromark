module.exports = flatMap

function flatMap(array, map) {
  var result = []
  var length = array.length
  var index = -1

  while (++index < length) {
    result = result.concat(map(array[index]))
  }

  return result
}
