import type * as typesObject from './constant/types'
import type {ValueOf} from 'type-fest'

export interface Token {
  start: unknown
  end: unknown
  _size: number
  contentType: string
  previous: Token
  next: Token
  _break?: boolean
}

export type types = ValueOf<typeof typesObject>

export type Event = [string, {type: unknown, start: unknown, end: unknown, contentType: unknown, _subevents?: Event[], _contentTokenized?: unknown}, unknown]

export interface Effects {
  enter: (type: types) => Token
  attempt: (one: unknown, two: unknown, three?: unknown) => Token
  consume: (code: number) => Token
  exit: (type: types) => Token
}

export interface Okay {
  (code: number): void
}

export interface NotOkay {
  (code: number): void
}
