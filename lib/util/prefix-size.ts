import * as assert from 'assert'
import type { Event } from '../types'
import * as types from '../constant/types'

export default function prefixSize(events: Event[], type: any) {
  var kind = type || types.linePrefix
  var tail = events[events.length - 1]
  if (!tail || tail[1].type !== kind) return 0
  assert(typeof tail[1]._size === 'number', 'expected size')
  return tail[1]._size
}
