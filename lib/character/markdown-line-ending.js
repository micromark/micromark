import {codes} from './codes.js'

export function markdownLineEnding(code) {
  return code < codes.horizontalTab
}
