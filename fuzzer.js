const micromark = require('./index')

function fuzz(buf) {
  try {
    micromark(buf)
  } catch (e) {
    if (e.message.indexOf('URI malformed') !== -1) {
    } else {
      throw e
    }
  }
}

module.exports = {
  fuzz
}
