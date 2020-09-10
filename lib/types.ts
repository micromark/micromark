import type * as typesObject from './constant/types'
import type {ValueOf} from 'type-fest'

export interface Token {
  start: unknown
  end: unknown
}

export type types = ValueOf<typeof typesObject>

export type Event = [string, unknown]
