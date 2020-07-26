module.exports = indexOfEach

function indexOfEach(value, list, fromIndex) {
  var index = -1
  var length = list.length
  var min = value.length
  var position

  while (++index < length) {
    position = value.indexOf(list[index], fromIndex)

    if (position !== -1 && position < min) {
      min = position
    }
  }

  return min
}
