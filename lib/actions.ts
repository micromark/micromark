export type ContextType = 'atxHeading' | 'paragraph' | 'block'

export enum ParseActionType {
  CONSUME = 'CONSUME',
  RECONSUME = 'RECONSUME',
  NEXT = 'NEXT',
  SWITCH_CONTEXT = 'SWITCH_CONTEXT'
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
      type: ParseActionType.NEXT
    }
  | {
      type: ParseActionType.SWITCH_CONTEXT
      context: ContextType
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

export function switchContext(
  context: ContextType
): { type: ParseActionType.SWITCH_CONTEXT; context: ContextType } {
  return {
    type: ParseActionType.SWITCH_CONTEXT,
    context
  }
}
