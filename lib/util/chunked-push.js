import {chunkedSplice} from './chunked-splice.js'

export function chunkedPush(list, items) {
  if (list.length > 0) {
    chunkedSplice(list, list.length, 0, items)
    return list
  }

  return items
}
