var nil = 0
var us = 31
var del = 127

module.exports = asciiControl

function asciiControl(code) {
  return (code >= nil && code <= us) || code === del
}
