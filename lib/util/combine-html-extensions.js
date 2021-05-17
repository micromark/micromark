import {hasOwnProperty} from '../constant/has-own-property.js'

// Combine several HTML extensions into one.
export function combineHtmlExtensions(extensions) {
  const handlers = {}
  let index = -1

  while (++index < extensions.length) {
    extension(handlers, extensions[index])
  }

  return handlers
}

function extension(handlers, extension) {
  let hook
  let left
  let right
  let type

  for (hook in extension) {
    left = hasOwnProperty.call(handlers, hook)
      ? handlers[hook]
      : (handlers[hook] = {})
    right = extension[hook]

    for (type in right) {
      left[type] = right[type]
    }
  }
}
