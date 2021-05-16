import {codes} from './codes.js'

export function markdownLineEndingOrSpace(code) {
  return code < codes.nul || code === codes.space
}
