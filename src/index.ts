import {useEffect} from 'react'
import useAsyncReducer from 'use-async-reducer'

interface UseAsyncCallOptions<T> {
  dependencies?: ReadonlyArray<any>
  initialValue?: T
  onSuccess?(data?: T): void
  onFailure?(error?: Error): void
  onComplete?(): void
}

export default function useAsyncCall<T extends any>(
  asyncCreator: () => Promise<T>,
  options: UseAsyncCallOptions<T> = {}
) {
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
    ...(options.dependencies || []),
    asyncCreator,
    options.onSuccess,
    options.onFailure,
    options.onComplete
  ])

  return response
}
