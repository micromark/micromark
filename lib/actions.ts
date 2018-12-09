export enum ParseActionType {
  NOOP = 'NOOP',
  CONSUME = 'CONSUME',
  RECONSUME = 'RECONSUME',
  NEXT = 'NEXT'
}

export type ParseAction<StateType extends string> =
  | {
      type: ParseActionType.RECONSUME
      state: StateType
    }
  | {
      type: ParseActionType.CONSUME
    }
  | {
      type: ParseActionType.NOOP
    }
  | {
      type: ParseActionType.NEXT
    }

export function consume(): {
  type: ParseActionType.CONSUME
} {
  return {
    type: ParseActionType.CONSUME
  }
}

export function reconsume<StateType extends string>(state: StateType): ParseAction<StateType> {
  return {
    type: ParseActionType.RECONSUME,
    state
  }
}

export function next(): {
  type: ParseActionType.NEXT
} {
  return {
    type: ParseActionType.NEXT
  }
}

export function noop(): { type: ParseActionType.NOOP } {
  return {
    type: ParseActionType.NOOP
  }
}
