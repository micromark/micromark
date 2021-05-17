import {sizeChunks} from './size-chunks.js'

export function prefixSize(events, type) {
  const tail = events[events.length - 1]
  if (!tail || tail[1].type !== type) return 0
  return sizeChunks(tail[2].sliceStream(tail[1]))
}
