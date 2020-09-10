import * as codes from '../character/codes'
import * as constants from '../constant/constants'

export default function lowercase(code: number) {
  return code > codes.atSign && code < codes.leftSquareBracket
    ? code + constants.asciiAlphaCaseDifference
    : code
}
