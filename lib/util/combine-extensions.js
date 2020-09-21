module.exports = combineExtensions

var own = require('../constant/has-own-property')

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
  var constructs

  for (hook in extension) {
    left = own.call(all, hook) ? all[hook] : (all[hook] = {})
    right = extension[hook]

    for (code in right) {
      constructs = mergeConstructs(
        [].concat(right[code] || []),
        own.call(left, code) ? left[code] : []
      )

      left[code] = constructs.length === 1 ? constructs[0] : constructs
    }
  }

  function mergeConstructs(constructs, between) {
    var length = constructs.length
    var index = -1
    var before = []
    var after = []
    var list

    while (++index < length) {
      list = constructs[index].add === 'after' ? after : before
      list.push(constructs[index])
    }

    return before.concat(between, after)
  }
}
