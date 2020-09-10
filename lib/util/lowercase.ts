module.exports = lowercase

import codes from '../character/codes'
import constants from '../constant/constants'

// @ts-expect-error ts-migrate(2300) FIXME: Duplicate identifier 'lowercase'.
function lowercase(code: any) {
  return code > codes.atSign && code < codes.leftSquareBracket
    ? code + constants.asciiAlphaCaseDifference
    : code
}
