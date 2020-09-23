module.exports = combineExtensions

var own = require('../constant/has-own-property')
var miniflat = require('./miniflat')
var chunkedSplice = require('./chunked-splice')

// Combine several syntax extensions into one.
function combineExtensions(extensions) {
  var all = {}
  var length = extensions.length
  var index = -1

  while (++index < length) {
    extension(all, extensions[index])
  }

  return all
}

function extension(all, extension) {
  var hook
  var left
  var right
  var code

  for (hook in extension) {
    left = own.call(all, hook) ? all[hook] : (all[hook] = {})
    right = extension[hook]

    for (code in right) {
      left[code] = constructs(
        miniflat(right[code]),
        own.call(left, code) ? left[code] : []
      )
    }
  }
}

function constructs(list, existing) {
  var length = list.length
  var index = -1
  var before = []

  while (++index < length) {
    ;(list[index].add === 'after' ? existing : before).push(list[index])
  }

  chunkedSplice(existing, 0, 0, before)
  return existing
}
