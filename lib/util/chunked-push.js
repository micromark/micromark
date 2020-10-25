module.exports = chunkedPush

var chunkedSplice = require('./chunked-splice')

function chunkedPush(list, items) {
  if (list.length) {
    chunkedSplice(list, list.length, 0, items)
    return list
  }

  return items
}
