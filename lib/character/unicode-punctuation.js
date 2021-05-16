import {unicodePunctuationRegex} from '../constant/unicode-punctuation-regex.js'
import {regexCheck} from '../util/regex-check.js'

// Size note: removing ASCII from the regex and using `ascii-punctuation` here
// In fact adds to the bundle size.
export const unicodePunctuation = regexCheck(unicodePunctuationRegex)
