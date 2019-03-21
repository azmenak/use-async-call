import {useEffect} from 'react'
import useAsyncReducer from 'use-async-reducer'

interface UseAsyncCallOptions<T> {
  dependencies?: ReadonlyArray<any>
  initialValue?: T
  onSuccess?(data?: T): void
  onFailure?(error?: Error): void
}

export default function useAsyncCall<T extends any>(
  asyncCreator: () => Promise<T>,
  options: UseAsyncCallOptions<T> = {}
) {
  const [response, actions] = useAsyncReducer<T>(options.initialValue)

  useEffect(() => {
    const callAsync = async () => {
      actions.request()
      try {
        const data = await asyncCreator()
        actions.success(data)
        if (typeof options.onSuccess === 'function') {
          options.onSuccess(data)
        }
      } catch (error) {
        actions.failure(error)
        if (typeof options.onFailure === 'function') {
          options.onFailure(error)
        }
      }
    }

    callAsync()
  }, [...(options.dependencies || []), asyncCreator])

  return response
}
