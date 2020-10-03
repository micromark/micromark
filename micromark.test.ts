import {EventEmitter} from 'events'
import micromarkBuffer from 'micromark'
import micromarkStream from 'micromark/stream'

// $ExpectType string
const html: string = micromarkBuffer('# text **strong**', {
  allowDangerousHtml: true,
  allowDangerousProtocol: true,
  extensions: []
})

// $ExpectType EventEmitter
const emitter: EventEmitter = micromarkStream({
  allowDangerousHtml: true,
  allowDangerousProtocol: true
})

if (html || emitter) {
  // Do nothing
}
