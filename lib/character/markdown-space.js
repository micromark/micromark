module.exports = markdownSpace

var codes = require('./codes')

function markdownSpace(code) {
  return code === codes.ht || code === codes.vs || code === codes.space
}
