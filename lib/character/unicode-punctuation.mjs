import unicodePunctuation from '../constant/unicode-punctuation-regex'
import check from '../util/regex-check'

// Size note: removing ASCII from the regex and using `ascii-punctuation` here
// In fact adds to the bundle size.
export default check(unicodePunctuation)
