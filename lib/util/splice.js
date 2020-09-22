var chunkSize = 10000

// Array#splice takes all items to be inserted as individual argument which causes a stackoverflow when trying to insert 100k items for instance
function chunkedSplice(array, start, deleteCount, items) {
  var splice = [].splice

  // Make deleteCount >= 0
  deleteCount = deleteCount > 0 ? deleteCount : 0
  // Make start between 0 and array.length (included)
  if (start < 0) {
    start = -start > array.length ? 0 : array.length + start
  } else {
      start = start > array.length ? array.length : start
  }

  if (items.length < chunkSize) {
    // No need to chunk the items in this case
    return splice.apply(array, [start, deleteCount].concat(items))
  }

  // Delete deleteCount items starting from `start`
  var result = splice.apply(array, [start, deleteCount])
  // Insert the items by chunks so we won't cause a stackoverflow
  var chunkStart = 0
  while (chunkStart < items.length) {
    var chunk = items.slice(chunkStart, chunkStart + chunkSize)
    chunk.unshift(start, 0)
    splice.apply(array, chunk)

    chunkStart += chunkSize
    start += chunkSize
  }

  return result
}

module.exports = chunkedSplice
