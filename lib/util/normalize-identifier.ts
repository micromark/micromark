import * as values from '../character/values'

export default function normalizeIdentifier(value: string) {
  return value
    // Collapse Markdown whitespace.
    .replace(/[\t\n\r ]+/g, values.space)
    // Trim.
    .replace(/^ | $/g, '')
    // Some characters are considered “uppercase”, but if their lowercase
    // counterpart is uppercased will result in a different uppercase
    // character.
    // Hence, to get that form, we perform both lower- and uppercase.
    // Upper case makes sure keys will not interact with default prototypal
    // methods: no object method is uppercase.
    .toLowerCase()
    .toUpperCase();
}
