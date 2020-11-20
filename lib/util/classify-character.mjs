export default classifyCharacter

import * as codes from '../character/codes'
import markdownLineEndingOrSpace from '../character/markdown-line-ending-or-space'
import unicodePunctuation from '../character/unicode-punctuation'
import unicodeWhitespace from '../character/unicode-whitespace'
import * as constants from '../constant/constants'

// Classify whether a character is unicode whitespace, unicode punctuation, or
// anything else.
// Used for attention (emphasis, strong), whose sequences can open or close
// based on the class of surrounding characters.
function classifyCharacter(code) {
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
