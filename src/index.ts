import {useEffect, useCallback} from 'react'
import useAsyncReducer, {Loadable} from 'use-async-reducer'

export {Loadable} from 'use-async-reducer'

export interface UseAsyncCallOptions<T> {
  initialValue?: T
  onSuccess?(data?: T): void
  onFailure?(error?: Error): void
  onComplete?(): void
}

export interface UseAsyncCallUpdateOptions<T> {
  throwError?: boolean
  saveError?: boolean
  onSuccess?(data?: T): void
  onFailure?(error?: Error): void
  onComplete?(): void
}

export type UseAsyncCallUpdater<T> = (
  asyncUpdater: Promise<T> | (() => Promise<T>),
  updateOptions?: UseAsyncCallUpdateOptions<T>
) => Promise<T | undefined>

export type UseAsyncCellReturnType<T> = [Loadable<T>, UseAsyncCallUpdater<T>]

function getUpdaterPromise<T extends any>(
  asyncUpdater: Promise<T> | (() => Promise<T>)
): Promise<T> {
  if (typeof asyncUpdater === 'function') {
    return asyncUpdater()
  }

  return asyncUpdater
}

export default function useAsyncCall<T extends any>(
  asyncCreator: () => Promise<T>,
  options: UseAsyncCallOptions<T> = {}
): UseAsyncCellReturnType<T> {
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
  }, [asyncCreator, options.onSuccess, options.onFailure, options.onComplete])

  const update: UseAsyncCallUpdater<T> = useCallback(
    async (
      asyncUpdater: Promise<T> | (() => Promise<T>),
      updateOptions: UseAsyncCallUpdateOptions<T> = {}
    ) => {
      // Placeholder while working out how to cancel updates when the update
      // method changes
      let updateDidCancel = false

      actions.request()
      try {
        const data = await getUpdaterPromise(asyncUpdater)
        if (updateDidCancel) {
          return
        }

        actions.success(data)
        if (typeof updateOptions.onSuccess === 'function') {
          updateOptions.onSuccess(data)
        }

        return data
      } catch (error) {
        if (updateDidCancel) {
          return
        }

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
        if (updateDidCancel) {
          return
        }

        if (typeof updateOptions.onComplete === 'function') {
          updateOptions.onComplete()
        }
      }
    },
    [actions]
  )

  return [response, update]
}
