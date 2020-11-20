export default regexCheck

import fromCharCode from '../constant/from-char-code'

function regexCheck(regex) {
  return check
  function check(code) {
    return regex.test(fromCharCode(code))
  }
}
