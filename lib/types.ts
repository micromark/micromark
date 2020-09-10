import type * as typesObject from './constant/types'
import type {ValueOf} from 'type-fest'

export interface Token {
  start: unknown
  end: unknown
  contentType: string
  previous: Token
  next: Token
  _size: number
  _break?: boolean
  _tokenizer: unknown
}

export type types = ValueOf<typeof typesObject>

export type Event = [string, {type: unknown, start: unknown, end: unknown, contentType: unknown, _subevents?: Event[], _size: number, _contentTokenized?: unknown}, unknown]

export interface Effects {
  enter: (type: types) => Token
  consume: (code: number) => Token
  exit: (type: types) => Token
  attempt: (one: unknown, two: unknown, three?: unknown) => (code: number) => unknown
  interrupt: (one: unknown, two: unknown, three: unknown) => (code: number) => unknown
  check: (one: unknown, two: unknown, three?: unknown) => (code: number) => unknown
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