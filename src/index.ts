import {useReducer, useCallback} from 'react'
import {ActionType, getType} from 'typesafe-actions'

import * as actions from './actions'

interface UseArrayStateOperations<T extends any> {
  /**
   * Appends `value` to end
   */
  push(value: T): void
  /**
   * Appends `value` to beginning
   */
  unshift(value: T): void
  /**
   * Invokes `Array.prototype.splice` without mutating original value
   */
  splice(start: number, deleteCount?: number, ...values: T[]): void
  /**
   * Invokes `Array.prototype.pop` without mutating original value
   */
  pop(): void
  /**
   * Invokes `Array.prototype.shift` without mutating original value
   */
  shift(): void
  /**
   * Updates value at index
   */
  update(index: number, value: T): void
  /**
   * Replace the entire value of state, passed through second param of `useState`
   */
  set(values: T[]): void
  /**
   * Inserts `value` at `index`
   */
  insert(index: number, value: T): void
  /**
   * Moves value at index `from` to position `to`
   * If the `to` position is longer then the array, the array will grow
   * with undefined values to accomodate
   */
  move(from: number, to: number): void
  /**
   * Removes element at `index`
   */
  remove(index: number): void
  /**
   * Swap elements to new positions in the array
   * If either index is longer then the array, the array will with
   * undefined values to accomodate
   */
  swap(indexA: number, indexB: number): void
}

export const reducer = (state: any[], action: ActionType<typeof actions>) => {
  switch (action.type) {
    case getType(actions.push):
      return [...state, action.payload]
    case getType(actions.pop):
      return state.slice(0, state.length - 1)
    case getType(actions.unshift):
      return [action.payload, ...state]
    case getType(actions.shift):
      return state.slice(1, state.length)
    case getType(actions.splice): {
      const nextState = [...state]
      nextState.splice(...action.payload)

      return nextState
    }
    case getType(actions.update): {
      const nextState = [...state]
      nextState[action.payload.index] = action.payload.value

      return nextState
    }
    case getType(actions.set):
      return action.payload
    case getType(actions.insert): {
      const nextState = [...state]
      nextState.splice(action.payload.index, 0, action.payload.value)

      return nextState
    }
    case getType(actions.move): {
      const nextState = [...state]
      if (action.payload.to >= nextState.length) {
        let i = action.payload.to - nextState.length + 1
        while (i--) {
          nextState.push(undefined)
        }
      }

      nextState.splice(
        action.payload.to,
        0,
        nextState.splice(action.payload.from, 1)[0]
      )

      return nextState
    }
    case getType(actions.remove): {
      const nextState = [...state]
      nextState.splice(action.payload, 1)

      return nextState
    }
    case getType(actions.swap): {
      const nextState = [...state]
      const largestIndex = Math.max(...action.payload)
      if (largestIndex >= nextState.length) {
        let i = largestIndex - nextState.length + 1
        while (i--) {
          nextState.push(undefined)
        }
      }

      ;[nextState[action.payload[0]], nextState[action.payload[1]]] = [
        nextState[action.payload[1]],
        nextState[action.payload[0]]
      ]

      return nextState
    }
    default:
      return state
  }
}

export default function useArrayState<T extends any>(
  initialState?: T[]
): [T[], UseArrayStateOperations<T>] {
  const [state, dispatch] = useReducer(reducer, initialState || [])

  const boundActions: UseArrayStateOperations<T> = {
    push: useCallback((value) => dispatch(actions.push(value)), []),
    pop: useCallback(() => dispatch(actions.pop()), []),
    unshift: useCallback((value) => dispatch(actions.unshift(value)), []),
    shift: useCallback(() => dispatch(actions.shift()), []),
    splice: useCallback(
      (start, deleteCount, ...args) =>
        dispatch(actions.splice([start, deleteCount, ...args])),
      []
    ),
    update: useCallback(
      (index, value) => dispatch(actions.update({index, value})),
      []
    ),
    set: useCallback((value) => dispatch(actions.set(value)), []),
    insert: useCallback(
      (index, value) => dispatch(actions.insert({index, value})),
      []
    ),
    move: useCallback((from, to) => dispatch(actions.move({from, to})), []),
    remove: useCallback((index) => dispatch(actions.remove(index)), []),
    swap: useCallback(
      (indexA, indexB) => dispatch(actions.swap([indexA, indexB])),
      []
    )
  }

  return [state, boundActions]
}
