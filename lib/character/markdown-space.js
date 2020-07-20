var codes = require('./codes')

module.exports = markdownSpace

function markdownSpace(code) {
  return code === codes.ht || code === codes.vs || code === codes.space
}
