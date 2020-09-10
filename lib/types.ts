import type * as typesObject from './constant/types'
import type {ValueOf} from 'type-fest'

export interface Point {
  line: number
  column: number
  offset: number
  _index: number
  _bufferIndex: number
}
export interface Token {
  start: Point
  end: Point
  type: unknown
  contentType: string
  previous: Token
  next: Token
  _size: number
  _break?: boolean
  _tokenizer?: unknown
  _events?: Event[]
  _subevents?: Event[]
  _contentTokenized?: unknown
  _close?: unknown
  _marker?: unknown
  _open?: unknown
  _side?: number
  _tabs?: unknown
}

export type Type = ValueOf<typeof typesObject>

export type Event = [name: string, token: Token, context: unknown]

export interface Effects {
  enter: (type: Type) => Token
  consume: (code: number) => Token
  exit: (type: Type) => Token
  attempt: (
    one: unknown,
    two: unknown,
    three?: unknown
  ) => (code: number) => unknown
  interrupt: (
    one: unknown,
    two: unknown,
    three: unknown
  ) => (code: number) => unknown
  check: (
    one: unknown,
    two: unknown,
    three?: unknown
  ) => (code: number) => unknown
  lazy: (one: unknown, ok: Okay, nok: NotOkay) => void
}

export interface Okay {
  (code: number): void
}

export interface NotOkay {
  (code: number): void
}

export interface Parser {
  hooks: {
    [key: string]: unknown
  }
  flow: (something: unknown) => unknown
}

export interface TokenizerThis {
  events: Event[]
  interrupt: unknown
  lazy: unknown
  containerState: {
    marker: number
    type: Type
    initialBlankLine: unknown
    size: number
    _closeFlow: unknown
    furtherBlankLines: unknown
  }
}
