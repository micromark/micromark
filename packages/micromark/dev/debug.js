/* This code runs on both browser & server, the default require("process") rule will break under browser environments */
/* eslint n/prefer-global/process: [error] */

/** @param {string} namespace */
const isDebugFunction = (namespace) => {
  if (typeof process !== 'undefined' && process.env.DEBUG) {
    /** @type {string[]} */
    const namespaces = process.env.DEBUG.trim().split(/\s+|,/g).filter(Boolean)

    let v = false
    for (const item of namespaces) {
      if (item === '*' || item === namespace) v = true
      else if (item === `-${namespace}`) v = false
    }
    return v
  }

  return false
}

export const IS_DEBUG = isDebugFunction('micromark')
