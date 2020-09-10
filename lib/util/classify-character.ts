import * as codes from '../character/codes'
import markdownLineEndingOrSpace from '../character/markdown-line-ending-or-space'
import unicodePunctuation from '../character/unicode-punctuation'
import unicodeWhitespace from '../character/unicode-whitespace'
import * as constants from '../constant/constants'

export default function classifyCharacter(code: number) {
  if (
    code === codes.eof ||
    markdownLineEndingOrSpace(code) ||
    unicodeWhitespace(code)
  ) {
    return constants.characterGroupWhitespace
  }

  if (unicodePunctuation(code)) {
    return constants.characterGroupPunctuation
  }
}
