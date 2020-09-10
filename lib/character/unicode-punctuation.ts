import unicodePunctuation from '../constant/unicode-punctuation-regex'
import fromCharCode from '../constant/from-char-code'

// Size note: removing ASCII from the regex and using `ascii-punctuation` here
// In fact adds to the bundle size.
export default function punctuation(code: number) {
  return unicodePunctuation.test(fromCharCode(code))
}
