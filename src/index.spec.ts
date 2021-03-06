import {renderHook, act} from '@testing-library/react-hooks'

import useAsyncCall from '.'

function flushPromiseQueue() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, 0)
  })
}

describe('use-async-call', () => {
  it('sets the response value to the result of the promise', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    expect(result.current[0].data).toBe(null)
    expect(call).toHaveBeenCalled()

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0].data).toBe(true)
  })

  it('calls success callback after success with data', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const onSuccess = jest.fn()
    const {waitForNextUpdate} = renderHook(() =>
      useAsyncCall(call, {onSuccess})
    )

    expect(onSuccess).not.toHaveBeenCalled()

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(onSuccess).toHaveBeenCalledWith(true)
  })

  it('calls onComplete callback in success and failure cases', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const onComplete = jest.fn()

    const {waitForNextUpdate, rerender} = renderHook(
      ({caller}) => useAsyncCall(caller, {onComplete}),
      {initialProps: {caller: call}}
    )

    expect(onComplete).not.toHaveBeenCalled()
    await act(async () => {
      await waitForNextUpdate()
    })

    expect(onComplete).toHaveBeenCalledTimes(1)

    const failCall = jest.fn(() => Promise.reject(new Error()))

    rerender({caller: failCall})

    expect(onComplete).toHaveBeenCalledTimes(1)
    await act(async () => {
      await waitForNextUpdate()
    })

    expect(onComplete).toHaveBeenCalledTimes(2)
  })

  it('sets the error in response after rejection', async () => {
    const err = new Error()
    const call = jest.fn(() => Promise.reject(err))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    expect(result.current[0].data).toBe(null)
    expect(result.current[0].error).toBe(null)
    expect(call).toHaveBeenCalled()

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0].data).toBe(null)
    expect(result.current[0].error).toBe(err)
  })

  it('calls error callback after error with error', async () => {
    const err = new Error()
    const call = jest.fn(() => Promise.reject(err))
    const onSuccess = jest.fn()
    const onFailure = jest.fn()
    const {waitForNextUpdate} = renderHook(() =>
      useAsyncCall(call, {onSuccess, onFailure})
    )

    expect(onSuccess).not.toHaveBeenCalled()
    expect(onFailure).not.toHaveBeenCalled()

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(onSuccess).not.toHaveBeenCalled()
    expect(onFailure).toHaveBeenCalledWith(err)
  })

  it('does not call handlers when the input method changes', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const onSuccess = jest.fn()
    const onFailure = jest.fn()
    const {waitForNextUpdate, rerender} = renderHook(
      ({caller}) => useAsyncCall(caller, {onSuccess, onFailure}),
      {initialProps: {caller: call}}
    )

    expect(onSuccess).not.toHaveBeenCalled()

    const nextCall = jest.fn(() => Promise.resolve(false))
    rerender({caller: nextCall})

    expect(onSuccess).not.toHaveBeenCalled()

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(false)

    const callFail = jest.fn(() => Promise.reject(new Error()))
    rerender({caller: callFail})

    expect(onFailure).not.toHaveBeenCalled()

    const nextCallFail = jest.fn(() => Promise.reject(new Error()))
    rerender({caller: nextCallFail})

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(onFailure).toHaveBeenCalledTimes(1)
  })

  it('calls to update function, update the loading state and data state', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    expect(result.current[0].data).toBe(null)
    expect(call).toHaveBeenCalled()

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0].data).toBe(true)

    const update = jest.fn(() => Promise.resolve(false))
    const onSuccess = jest.fn()

    act(() => {
      result.current[1].update(update, {onSuccess})
    })

    expect(update).toHaveBeenCalledTimes(1)
    expect(result.current[0].loading).toBe(true)
    expect(onSuccess).not.toBeCalled()

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].data).toBe(false)
    expect(onSuccess).toHaveBeenCalledWith(false)
  })

  it('does not update state for update failures', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await act(async () => {
      await waitForNextUpdate()
    })

    const error = new Error()
    const updateFail = jest.fn(() => Promise.reject(error))
    const onFailure = jest.fn()
    const onComplete = jest.fn()

    act(() => {
      result.current[1].update(updateFail, {onFailure, onComplete})
    })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].data).toBe(true)
    expect(result.current[0].error).toBe(null)
    expect(onFailure).toHaveBeenCalledWith(error)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('updates state for update failures', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await act(async () => {
      await waitForNextUpdate()
    })

    const update = jest.fn(() => Promise.resolve(false))
    act(() => {
      result.current[1].update(update)
    })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].data).toBe(false)
    expect(result.current[0].error).toBe(null)
  })

  it('implements default update behaviour when no options passed', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await act(async () => {
      await waitForNextUpdate()
    })

    const error = new Error()
    const updateFail = jest.fn(() => Promise.reject(error))

    act(() => {
      result.current[1].update(updateFail, {saveError: true})
    })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].data).toBe(null)
    expect(result.current[0].error).toBe(error)
  })

  it('throws an error when rejecting with throw config', async () => {
    expect.assertions(1)

    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await act(async () => {
      await waitForNextUpdate()
    })

    const error = new Error()
    const updateFail = jest.fn(() => Promise.reject(error))

    await act(async () => {
      try {
        await result.current[1].update(updateFail, {throwError: true})
      } catch (err) {
        expect(err).toBe(error)
      }
    })
  })

  it('update works with promise instead of method argument', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await act(async () => {
      await waitForNextUpdate()
    })

    const onSuccess = jest.fn()

    act(() => {
      result.current[1].update(Promise.resolve(false), {onSuccess})
    })

    expect(onSuccess).not.toBeCalled()

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(onSuccess).toHaveBeenCalledWith(false)
  })

  it('calls the async caller when returned refresh method is called', async () => {
    let count = 0
    const call = jest.fn(() => Promise.resolve(count++))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    expect(result.current[0].data).toBe(null)
    expect(call).toHaveBeenCalledTimes(1)

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0].data).toBe(0)

    act(() => {
      result.current[1].refresh()
    })

    expect(call).toHaveBeenCalledTimes(2)
    expect(result.current[0].data).toBe(0)
    expect(result.current[0].loading).toBe(true)

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0].data).toBe(1)
    expect(result.current[0].loading).toBe(false)
  })

  it('binds the state to the reference of the async caller', async () => {
    const call1 = jest.fn(() => Promise.resolve(1))
    const call2 = jest.fn(() => Promise.resolve(2))

    const {waitForNextUpdate, rerender, result} = renderHook(
      ({caller}) => useAsyncCall(caller),
      {initialProps: {caller: call1}}
    )

    expect(result.current[0]).toEqual({
      data: null,
      loading: true,
      error: null
    })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0]).toEqual({
      data: 1,
      loading: false,
      error: null
    })

    rerender({caller: call2})

    expect(result.current[0]).toEqual({
      data: null,
      loading: true,
      error: null
    })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0]).toEqual({
      data: 2,
      loading: false,
      error: null
    })
  })

  it('discards the local state if the asyncCaller changes durtion update', async () => {
    const call1 = jest.fn(() => Promise.resolve(1))
    const call2 = jest.fn(() => Promise.resolve(2))

    const {waitForNextUpdate, rerender, result} = renderHook(
      ({caller}) => useAsyncCall(caller),
      {initialProps: {caller: call1}}
    )

    await act(async () => {
      await waitForNextUpdate()
    })

    act(() => {
      result.current[1].update(Promise.resolve(3))
    })

    expect(result.current[0]).toEqual({
      data: 1,
      loading: true,
      error: null
    })

    rerender({caller: call2})

    expect(result.current[0]).toEqual({
      data: null,
      loading: true,
      error: null
    })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0]).toEqual({
      data: 2,
      loading: false,
      error: null
    })
  })

  it('does not update state if component is unmounted during update', async () => {
    const call = jest.fn(() => Promise.resolve(1))
    const {result, waitForNextUpdate, unmount} = renderHook(() =>
      useAsyncCall(call)
    )

    await act(async () => {
      await waitForNextUpdate()
    })

    const onSuccess = jest.fn()
    act(() => {
      result.current[1].update(Promise.resolve(2), {onSuccess})
    })

    expect(result.current[0]).toEqual({
      data: 1,
      loading: true,
      error: null
    })

    unmount()

    expect(result.current[0]).toEqual({
      data: 1,
      loading: true,
      error: null
    })

    await flushPromiseQueue()

    expect(onSuccess).toHaveBeenCalledWith(2)
  })

  it('maintains the data between updates when dontReinitialize is true', async () => {
    const call1 = jest.fn(() => Promise.resolve(1))
    const call2 = jest.fn(() => Promise.resolve(2))

    const {waitForNextUpdate, rerender, result} = renderHook(
      ({caller}) => useAsyncCall(caller, {dontReinitialize: true}),
      {initialProps: {caller: call1}}
    )

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0]).toEqual({
      data: 1,
      loading: false,
      error: null
    })

    rerender({caller: call2})

    expect(result.current[0]).toEqual({
      data: 1,
      loading: true,
      error: null
    })

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0]).toEqual({
      data: 2,
      loading: false,
      error: null
    })
  })

  it('waits for truthy values in "waitFor" array', async () => {
    const call1 = jest.fn(() => Promise.resolve(1))
    const waitFor = [false, false]

    const {result, waitForNextUpdate, rerender} = renderHook(() =>
      useAsyncCall(call1, {waitFor})
    )

    rerender()

    expect(result.current[0]).toEqual({
      data: null,
      loading: true,
      error: null
    })

    waitFor[0] = true

    expect(result.current[0]).toEqual({
      data: null,
      loading: true,
      error: null
    })

    waitFor[1] = true

    rerender()

    await act(async () => {
      await waitForNextUpdate()
    })

    expect(result.current[0]).toEqual({
      data: 1,
      loading: false,
      error: null
    })
  })
})
