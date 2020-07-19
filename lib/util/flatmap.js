module.exports = flatmap

function flatmap(array, func) {
  var result = []
  var length = array.length
  var index = -1

  while (++index < length) {
    result = result.concat(func(array[index]))
  }

  return result
}
