/**
 * Plain old regular Array#splice may cause stackoverflow if we have too many items
 */
function chunkedSplice(array, start, deleteCount, items) {
  var splice = [].splice

  // Make deleteCount >= 0
  deleteCount = Math.max(deleteCount, 0)
  // Make start between 0 and array.length (included)
  start = Math.min(start, array.length)
  if (start < 0) {
    start = Math.max(array.length + start, 0)
  }

  // Delete deleteCount items starting from `start`
  var result = splice.apply(array, [start, deleteCount])

  // Insert the items by chunks so we won't cause a stackoverflow
  var chunkSize = 10000
  var chunkStart = 0
  while (chunkStart < items.length) {
    var chunk = items.slice(chunkStart, chunkStart + chunkSize)
    splice.apply(array, [start, 0, ...chunk])

    chunkStart += chunkSize
    start += chunkSize
  }

  return result
}

module.exports = chunkedSplice
