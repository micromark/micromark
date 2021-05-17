import {hasOwnProperty} from '../constant/has-own-property.js'
import {chunkedSplice} from './chunked-splice.js'
import {miniflat} from './miniflat.js'

// Combine several syntax extensions into one.
export function combineExtensions(extensions) {
  const all = {}
  let index = -1

  while (++index < extensions.length) {
    extension(all, extensions[index])
  }

  return all
}

function extension(all, extension) {
  let hook
  let left
  let right
  let code

  for (hook in extension) {
    left = hasOwnProperty.call(all, hook) ? all[hook] : (all[hook] = {})
    right = extension[hook]

    for (code in right) {
      left[code] = constructs(
        miniflat(right[code]),
        hasOwnProperty.call(left, code) ? left[code] : []
      )
    }
  }
}

function constructs(list, existing) {
  let index = -1
  const before = []

  while (++index < list.length) {
    ;(list[index].add === 'after' ? existing : before).push(list[index])
  }

  chunkedSplice(existing, 0, 0, before)
  return existing
}
