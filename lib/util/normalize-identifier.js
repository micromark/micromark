var values = require('../character/values')

module.exports = normalizeIdentifier

function normalizeIdentifier(value) {
  return (
    value
      // Collapse Markdown whitespace.
      .replace(/[ \t\r\n]+/g, values.space)
      // Some characters are considered “uppercase”, but their lowercase
      // counterpart is uppercased will result in a different uppercase
      // character.
      // Hence, to get that form, we perform both lower- and uppercase.
      .toLowerCase()
      .toUpperCase()
  )
}
