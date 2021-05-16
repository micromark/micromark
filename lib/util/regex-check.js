import {fromCharCode} from '../constant/from-char-code.js'

export function regexCheck(regex) {
  return check
  function check(code) {
    return regex.test(fromCharCode(code))
  }
}
