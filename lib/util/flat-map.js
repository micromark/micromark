module.exports = flatMap

function flatMap(array, map) {
  var length = array.length
  var index = -1
  var result = []

  while (++index < length) {
    result = result.concat(map(array[index]))
  }

  return result
}
