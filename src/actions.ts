import {createStandardAction} from 'typesafe-actions'

export enum ACTION_TYPES {
  PUSH = 'PUSH',
  POP = 'POP',
  UNSHIFT = 'UNSHIFT',
  SHIFT = 'SHIFT',
  SPLICE = 'SPLICE',
  UPDATE = 'UPDATE',
  SET = 'SET',
  INSERT = 'INSERT',
  MOVE = 'MOVE',
  REMOVE = 'REMOVE',
  SWAP = 'SWAP'
}

export const push = createStandardAction(ACTION_TYPES.PUSH)<any>()
export const pop = createStandardAction(ACTION_TYPES.POP)<undefined>()
export const unshift = createStandardAction(ACTION_TYPES.UNSHIFT)<any>()
export const shift = createStandardAction(ACTION_TYPES.SHIFT)<undefined>()
export const splice = createStandardAction(ACTION_TYPES.SPLICE)<
  [number, number, ...any[]]
>()
export const update = createStandardAction(ACTION_TYPES.UPDATE)<{
  index: number
  value: any
}>()
export const set = createStandardAction(ACTION_TYPES.SET)<any[]>()
export const insert = createStandardAction(ACTION_TYPES.INSERT)<{
  index: number
  value: any
}>()
export const move = createStandardAction(ACTION_TYPES.MOVE)<{
  from: number
  to: number
}>()
export const remove = createStandardAction(ACTION_TYPES.REMOVE)<number>()
export const swap = createStandardAction(ACTION_TYPES.SWAP)<[number, number]>()
