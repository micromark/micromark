module.exports = normalizeUri

function normalizeUri(url) {
  return encodeURI(decodeURI(url))
}
