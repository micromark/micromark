/**
 * @typedef {import('../types.js').Resolve} Resolve
 * @typedef {import('../types.js').Initialize} Initialize
 * @typedef {import('../types.js').Construct} Construct
 * @typedef {import('../types.js').Initializer} Initializer
 * @typedef {import('../types.js').State} State
 * @typedef {import('../types.js').Code} Code
 */

import {codes} from '../character/codes.js'
import {assign} from '../constant/assign.js'
import {constants} from '../constant/constants.js'
import {types} from '../constant/types.js'
import {shallow} from '../util/shallow.js'

export const resolver = {resolveAll: createResolver()}
export const string = initializeFactory('string')
export const text = initializeFactory('text')

/**
 * @param {'string'|'text'} field
 * @returns {Initializer}
 */
function initializeFactory(field) {
  return {
    tokenize: initializeText,
    resolveAll: createResolver(
      field === 'text' ? resolveAllLineSuffixes : undefined
    )
  }

  /** @type {Initialize} */
  function initializeText(effects) {
    const self = this
    const constructs = this.parser.constructs[field]
    const text = effects.attempt(constructs, start, notText)

    return start

    /** @type {State} */
    function start(code) {
      return atBreak(code) ? text(code) : notText(code)
    }

    /** @type {State} */
    function notText(code) {
      if (code === codes.eof) {
        effects.consume(code)
        return
      }

      effects.enter(types.data)
      effects.consume(code)
      return data
    }

    /** @type {State} */
    function data(code) {
      if (atBreak(code)) {
        effects.exit(types.data)
        return text(code)
      }

      // Data.
      effects.consume(code)
      return data
    }

    /**
     * @param {Code} code
     * @returns {boolean}
     */
    function atBreak(code) {
      /** @type {Construct[]} */
      const list = constructs[code]
      let index = -1

      if (code === codes.eof) {
        return true
      }

      if (list) {
        while (++index < list.length) {
          if (
            !list[index].previous ||
            list[index].previous.call(self, self.previous)
          ) {
            return true
          }
        }
      }
    }
  }
}

/**
 * @param {Resolve} [extraResolver]
 * @returns {Resolve}
 */
function createResolver(extraResolver) {
  return resolveAllText

  /** @type {Resolve} */
  function resolveAllText(events, context) {
    let index = -1
    /** @type {number} */
    let enter

    // A rather boring computation (to merge adjacent `data` events) which
    // improves mm performance by 29%.
    while (++index <= events.length) {
      if (enter === undefined) {
        if (events[index] && events[index][1].type === types.data) {
          enter = index
          index++
        }
      } else if (!events[index] || events[index][1].type !== types.data) {
        // Don’t do anything if there is one data token.
        if (index !== enter + 2) {
          events[enter][1].end = events[index - 1][1].end
          events.splice(enter + 2, index - enter - 2)
          index = enter + 2
        }

        enter = undefined
      }
    }

    return extraResolver ? extraResolver(events, context) : events
  }
}

/**
 * A rather ugly set of instructions which again looks at chunks in the input
 * stream.
 * The reason to do this here is that it is *much* faster to parse in reverse.
 * And that we can’t hook into `null` to split the line suffix before an EOF.
 * To do: figure out if we can make this into a clean utility, or even in core.
 * As it will be useful for GFMs literal autolink extension (and maybe even
 * tables?)
 *
 * @type {Resolve}
 */
function resolveAllLineSuffixes(events, context) {
  let eventIndex = -1

  while (++eventIndex <= events.length) {
    if (
      (eventIndex === events.length ||
        events[eventIndex][1].type === types.lineEnding) &&
      events[eventIndex - 1][1].type === types.data
    ) {
      const data = events[eventIndex - 1][1]
      const chunks = context.sliceStream(data)
      let index = chunks.length
      let bufferIndex = -1
      let size = 0
      /** @type {boolean} */
      let tabs

      while (index--) {
        const chunk = chunks[index]

        if (typeof chunk === 'string') {
          bufferIndex = chunk.length

          while (chunk.charCodeAt(bufferIndex - 1) === codes.space) {
            size++
            bufferIndex--
          }

          if (bufferIndex) break
          bufferIndex = -1
        }
        // Number
        else if (chunk === codes.horizontalTab) {
          tabs = true
          size++
        } else if (chunk === codes.virtualSpace) {
          // Empty
        } else {
          // Replacement character, exit.
          index++
          break
        }
      }

      if (size) {
        const token = {
          type:
            eventIndex === events.length ||
            tabs ||
            size < constants.hardBreakPrefixSizeMin
              ? types.lineSuffix
              : types.hardBreakTrailing,
          start: {
            line: data.end.line,
            column: data.end.column - size,
            offset: data.end.offset - size,
            _index: data.start._index + index,
            _bufferIndex: index
              ? bufferIndex
              : data.start._bufferIndex + bufferIndex
          },
          end: shallow(data.end)
        }

        data.end = shallow(token.start)

        if (data.start.offset === data.end.offset) {
          assign(data, token)
        } else {
          events.splice(
            eventIndex,
            0,
            ['enter', token, context],
            ['exit', token, context]
          )
          eventIndex += 2
        }
      }

      eventIndex++
    }
  }

  return events
}
