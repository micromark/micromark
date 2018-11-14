var atxHeading = require('./atx-heading')
var paragraph = require('./paragraph')
var block = require('./block')
var c = require('./characters')

module.exports = Tokenizer

Tokenizer.prototype.write = write
Tokenizer.prototype.current = current
Tokenizer.prototype.now = now
Tokenizer.prototype.consume = consume
Tokenizer.prototype.reconsume = reconsume
Tokenizer.prototype.next = next
Tokenizer.prototype.switch = switchContext
Tokenizer.prototype.block = block
Tokenizer.prototype.atxHeading = atxHeading
Tokenizer.prototype.paragraph = paragraph

function Tokenizer() {
  this.data = ''
  this.line = 1
  this.column = 1
  this.virtualColumn = 1
  this.offset = 0
  this.switch('block')
}

function switchContext(name) {
  this.context = name
  this.stateHandlers = this[name]
  this.contextInfo = {}
  this.state = 'START_STATE'
}

function write(chunk) {
  var self = this

  self.data += chunk

  while (self.offset <= self.data.length) {
    self.next()
  }
}

function next() {
  var self = this
  var fn

  fn = self.stateHandlers[self.state]

  if (!fn) {
    throw new Error('Cannot handle `' + self.context + '.' + self.state + '`')
  }

  fn.call(self, self.current())
}

function reconsume(state) {
  this.state = state
  this.next()
}

function consume() {
  var self = this
  var code = self.current()
  var tabSize = self.tabSize

  if (code === c.eof || code === c.lineFeed) {
    self.line++
    self.column = 0
  } else if (code === c.tab) {
    self.virtualColumn =
      Math.floor(self.virtualColumn / tabSize) * tabSize + tabSize
  }

  console.log('consume: %s', self.state, self.now(), [
    String.fromCharCode(code)
  ])

  self.column++
  self.offset++
}

function current() {
  var self = this
  var length = self.data.length
  var offset = self.offset

  if (offset > length) {
    throw new Error('Cannot read after end')
  }

  // Use `null` instead of NaN for EOF code.
  if (length === offset) {
    return null
  }

  // Use `�` instead of `\0` (https://spec.commonmark.org/0.28/#insecure-characters).
  return self.data.charCodeAt(offset) || c.replacementCharacter
}

function now() {
  var self = this

  return {line: self.line, column: self.column, offset: self.offset}
}
