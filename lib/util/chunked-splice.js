module.exports = chunkedSplice

var splice = require('../constant/splice')
var constants = require('../constant/constants')

var v8MaxSafeChunkSize = constants.v8MaxSafeChunkSize

// `Array#splice` takes all items to be inserted as individual argument which
// causes a stack overflow in V8 when trying to insert 100k items for instance.
function chunkedSplice(list, start, remove, items) {
  var length = list.length
  var chunkStart = 0
  var result
  var chunk

  // Make `remove` zero or more.
  remove = remove > 0 ? remove : 0

  // Make start between zero and `length` (included).
  if (start < 0) {
    start = -start > length ? 0 : length + start
  } else {
    start = start > length ? length : start
  }

  length = items.length

  // No need to chunk the items if there’s only a couple (10k) items.
  if (length < v8MaxSafeChunkSize) {
    return splice.apply(list, [start, remove].concat(items))
  }

  // Delete `remove` items starting from `start`
  result = splice.apply(list, [start, remove])

  // Insert the items in chunks to not cause stack overflows.
  while (chunkStart < length) {
    chunk = items.slice(chunkStart, chunkStart + v8MaxSafeChunkSize)
    chunk.unshift(start, 0)
    splice.apply(list, chunk)

    chunkStart += v8MaxSafeChunkSize
    start += v8MaxSafeChunkSize
  }

  return result
}
