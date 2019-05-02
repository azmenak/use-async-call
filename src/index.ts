import {useEffect, useCallback, useState, useRef} from 'react'
import useAsyncReducer, {
  Loadable,
  AsyncReducerBoundActions
} from 'use-async-reducer'

export {Loadable} from 'use-async-reducer'

export interface UseAsyncCallOptions<T> {
  /**
   * Initial value used for `data` of state
   */
  initialValue?: T
  /**
   * When true, will not call `actions.initalize` when `asyncCreator` updates
   * This keeps the data in the store between updates, useful when the identity
   * of the data does not belong to the inputs, example would be a search
   * component that uses "search text" as an input
   */
  dontReinitialize?: boolean
  /**
   * Callback called after call is successful
   * @param data Data returned from async caller
   */
  onSuccess?(data?: T): void
  /**
   * Callback called after async call throws
   * @param error Error thrown by async caller
   */
  onFailure?(error?: Error): void
  /**
   * Callback always called after async call completes
   */
  onComplete?(): void
}

export interface UseAsyncCallUpdateOptions<T> {
  /**
   * Should thrown errors be re-thrown in the resulting promise from `update`;
   * useful when using in conjuction with form libraries that expect errors when
   * submitting form values
   */
  throwError?: boolean
  /**
   * If the caller throws, sets `state.error` to the error and `state.data` to
   * `null`
   */
  saveError?: boolean
  /**
   * Callback called after call is successful
   * @param data Data returned from async caller
   */
  onSuccess?(data?: T): void
  /**
   * Callback called after async call throws
   * @param error Error thrown by async caller
   */
  onFailure?(error?: Error): void
  /**
   * Callback always called after async call completes
   */
  onComplete?(): void
}

export type UseAsyncCallUpdater<T> = (
  asyncUpdater: Promise<T> | (() => Promise<T>),
  updateOptions?: UseAsyncCallUpdateOptions<T>
) => Promise<T | undefined>

export type UseAsyncCellReturnType<T> = [
  Loadable<T>,
  UseAsyncCallReturnTypeOptions<T>
]

export interface UseAsyncCallReturnTypeOptions<T> {
  /**
   * Method used to update the state though async calls, accepts a promise or
   * a method which returns a promise, the state data will be updated to the
   * result of the promise
   */
  update: UseAsyncCallUpdater<T>
  /**
   * When called, the method passed to `useAsyncCall` will be invoked
   */
  refresh(): void
  /**
   * Provides access to the reducer actions
   */
  actions: AsyncReducerBoundActions<T>
}

function getUpdaterPromise<T extends any>(
  asyncUpdater: Promise<T> | (() => Promise<T>)
): Promise<T> {
  if (typeof asyncUpdater === 'function') {
    return asyncUpdater()
  }

  return asyncUpdater
}

/**
 * Returns a Symbol which can be used as a dep
 */
export function useRefreshSymbol(): [Symbol, () => void] {
  const [refreshSymbol, setRefreshSymbol] = useState(() => Symbol())

  const updateSymbol = useCallback(() => {
    setRefreshSymbol(Symbol())
  }, [setRefreshSymbol])

  return [refreshSymbol, updateSymbol]
}

/**
 * Returns previous value, or null if first render pass
 * @param value updating value
 */
export function usePrevious<T extends any>(value: T): T | null {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

/**
 * Provides an abstraction to manage async state
 * @param asyncCreator Async method to call, create this method with `useCallback` if it uses state from the component
 * @param options
 * @returns An array of two values
 *  0. State of the async operation, an object with keys `data`, `loading`, `error`
 *  1. An object of dispatch method to update the state
 *
 * @see [https://github.com/azmenak/use-async-call/blob/master/README.md](https://github.com/azmenak/use-async-call/blob/master/README.md)
 */
export default function useAsyncCall<T extends any>(
  asyncCreator: () => Promise<T>,
  options: UseAsyncCallOptions<T> = {}
): UseAsyncCellReturnType<T> {
  const [refreshSymbol, refresh] = useRefreshSymbol()
  const previousAsyncCreator = usePrevious(asyncCreator)

  const [response, actions] = useAsyncReducer<T>(options.initialValue)
  useEffect(() => {
    let didCancel = false

    const callAsync = async () => {
      if (asyncCreator === previousAsyncCreator || options.dontReinitialize) {
        actions.request()
      } else {
        actions.initialize()
      }
      try {
        const data = await asyncCreator()
        if (didCancel) {
          return
        }

        actions.success(data)
        if (typeof options.onSuccess === 'function') {
          options.onSuccess(data)
        }
      } catch (error) {
        if (didCancel) {
          return
        }

        actions.failure(error)
        if (typeof options.onFailure === 'function') {
          options.onFailure(error)
        }
      } finally {
        if (didCancel) {
          return
        }

        if (typeof options.onComplete === 'function') {
          options.onComplete()
        }
      }
    }

    callAsync()

    return () => {
      didCancel = true
    }
  }, [asyncCreator, refreshSymbol, options.dontReinitialize])

  const isUnmounted = useRef(false)
  useEffect(() => {
    return () => {
      isUnmounted.current = true
    }
  }, [])

  const update: UseAsyncCallUpdater<T> = useCallback(
    async (
      asyncUpdater: Promise<T> | (() => Promise<T>),
      updateOptions: UseAsyncCallUpdateOptions<T> = {}
    ) => {
      const updateCreatorOwner = asyncCreator
      actions.request()
      try {
        const data = await getUpdaterPromise(asyncUpdater)

        if (
          updateCreatorOwner === previousAsyncCreator &&
          !isUnmounted.current
        ) {
          actions.success(data)
        }
        if (typeof updateOptions.onSuccess === 'function') {
          updateOptions.onSuccess(data)
        }

        return data
      } catch (error) {
        if (
          updateCreatorOwner === previousAsyncCreator &&
          !isUnmounted.current
        ) {
          if (updateOptions.saveError) {
            actions.failure(error)
          } else {
            actions.complete()
          }
        }

        if (typeof updateOptions.onFailure === 'function') {
          updateOptions.onFailure(error)
        }

        if (updateOptions.throwError) {
          throw error
        }
      } finally {
        if (typeof updateOptions.onComplete === 'function') {
          updateOptions.onComplete()
        }
      }
    },
    [actions, asyncCreator, previousAsyncCreator]
  )

  return [response, {update, refresh, actions}]
}
