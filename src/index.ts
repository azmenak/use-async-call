import {useEffect, useCallback, useState} from 'react'
import useAsyncReducer, {Loadable} from 'use-async-reducer'

export {Loadable} from 'use-async-reducer'

export interface UseAsyncCallOptions<T> {
  /**
   * Initial value used for `data` of state
   */
  initialValue?: T
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
  UseAsyncCallUpdater<T>,
  () => void
]

function getUpdaterPromise<T extends any>(
  asyncUpdater: Promise<T> | (() => Promise<T>)
): Promise<T> {
  if (typeof asyncUpdater === 'function') {
    return asyncUpdater()
  }

  return asyncUpdater
}

function useRefreshSymbol(): [Symbol, () => void] {
  const [refreshSymbol, setRefreshSymbol] = useState(() => Symbol())

  const updateSymbol = useCallback(() => {
    setRefreshSymbol(Symbol())
  }, [setRefreshSymbol])

  return [refreshSymbol, updateSymbol]
}

/**
 * Provides an abstraction to manage async state
 * @param asyncCreator Async method to call, create this method with `useCallback` if it uses state from the component
 * @param options
 */
export default function useAsyncCall<T extends any>(
  asyncCreator: () => Promise<T>,
  options: UseAsyncCallOptions<T> = {}
): UseAsyncCellReturnType<T> {
  const [refreshSymbol, refresh] = useRefreshSymbol()
  const [response, actions] = useAsyncReducer<T>(options.initialValue)
  useEffect(() => {
    let didCancel = false

    const callAsync = async () => {
      actions.request()
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
  }, [
    asyncCreator,
    options.onSuccess,
    options.onFailure,
    options.onComplete,
    refreshSymbol
  ])

  const update: UseAsyncCallUpdater<T> = useCallback(
    async (
      asyncUpdater: Promise<T> | (() => Promise<T>),
      updateOptions: UseAsyncCallUpdateOptions<T> = {}
    ) => {
      actions.request()
      try {
        const data = await getUpdaterPromise(asyncUpdater)

        actions.success(data)
        if (typeof updateOptions.onSuccess === 'function') {
          updateOptions.onSuccess(data)
        }

        return data
      } catch (error) {
        if (updateOptions.saveError) {
          actions.failure(error)
        } else {
          actions.complete()
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
    [actions]
  )

  return [response, update, refresh]
}
