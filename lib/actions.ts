export type ContextType = 'atxHeading' | 'paragraph' | 'block'

export type ParseActionType = 'CONSUME' | 'RECONSUME' | 'NEXT' | 'SWITCH_CONTEXT'

export const CONSUME = 'CONSUME'
export const RECONSUME = 'RECONSUME'
export const NEXT = 'NEXT'
export const SWITCH_CONTEXT = 'SWITCH_CONTEXT'

export type ParseAction<StateType extends string> =
  | {
      type: 'RECONSUME'
      state: StateType
    }
  | {
      type: 'CONSUME'
    }
  | {
      type: 'NEXT'
    }
  | {
      type: 'SWITCH_CONTEXT'
      context: ContextType
    }

export function consume(): {
  type: 'CONSUME'
} {
  return {
    type: CONSUME
  }
}

export function reconsume<StateType extends string>(state: StateType): ParseAction<StateType> {
  return {
    type: RECONSUME,
    state
  }
}

export function next(): {
  type: 'NEXT'
} {
  return {
    type: NEXT
  }
}

export function switchContext(
  context: ContextType
): {type: 'SWITCH_CONTEXT'; context: ContextType} {
  return {
    type: SWITCH_CONTEXT,
    context
  }
}
