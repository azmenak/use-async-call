import {renderHook, cleanup, act} from 'react-hooks-testing-library'

import useAsyncCall from '.'

/**
 * Hiding output of console.error due to excessive errors generated by
 * recat-testing-library about the requirement for `act` around
 * actions which update the state
 */
const consoleError = console.error.bind(console)
beforeAll(() => {
  console.error = () => {}
})
afterAll(() => {
  console.error = consoleError
})

afterEach(cleanup)

describe('use-async-call', () => {
  it('sets the response value to the result of the promise', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    expect(result.current[0].data).toBe(null)
    expect(call).toHaveBeenCalled()

    await waitForNextUpdate()

    expect(result.current[0].data).toBe(true)
  })

  it('calls success callback after success with data', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const onSuccess = jest.fn()
    const {waitForNextUpdate} = renderHook(() =>
      useAsyncCall(call, {onSuccess})
    )

    expect(onSuccess).not.toHaveBeenCalled()

    await waitForNextUpdate()

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
    await waitForNextUpdate()

    expect(onComplete).toHaveBeenCalledTimes(1)

    const failCall = jest.fn(() => Promise.reject(new Error()))

    rerender({caller: failCall})

    expect(onComplete).toHaveBeenCalledTimes(1)
    await waitForNextUpdate()

    expect(onComplete).toHaveBeenCalledTimes(2)
  })

  it('sets the error in response after rejection', async () => {
    const err = new Error()
    const call = jest.fn(() => Promise.reject(err))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    expect(result.current[0].data).toBe(null)
    expect(result.current[0].error).toBe(null)
    expect(call).toHaveBeenCalled()

    await waitForNextUpdate()

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

    await waitForNextUpdate()

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

    await waitForNextUpdate()

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith(false)

    const callFail = jest.fn(() => Promise.reject(new Error()))
    rerender({caller: callFail})

    expect(onFailure).not.toHaveBeenCalled()

    const nextCallFail = jest.fn(() => Promise.reject(new Error()))
    rerender({caller: nextCallFail})

    await waitForNextUpdate()

    expect(onFailure).toHaveBeenCalledTimes(1)
  })

  it('calls to update function, update the loading state and data state', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    expect(result.current[0].data).toBe(null)
    expect(call).toHaveBeenCalled()

    await waitForNextUpdate()

    expect(result.current[0].data).toBe(true)

    const update = jest.fn(() => Promise.resolve(false))
    const onSuccess = jest.fn()

    act(() => {
      result.current[1].update(update, {onSuccess})
    })

    expect(update).toHaveBeenCalledTimes(1)
    expect(result.current[0].loading).toBe(true)
    expect(onSuccess).not.toBeCalled()

    await waitForNextUpdate()

    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].data).toBe(false)
    expect(onSuccess).toHaveBeenCalledWith(false)
  })

  it('does not update state for update failures', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await waitForNextUpdate()

    const error = new Error()
    const updateFail = jest.fn(() => Promise.reject(error))
    const onFailure = jest.fn()
    const onComplete = jest.fn()

    act(() => {
      result.current[1].update(updateFail, {onFailure, onComplete})
    })

    await waitForNextUpdate()

    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].data).toBe(true)
    expect(result.current[0].error).toBe(null)
    expect(onFailure).toHaveBeenCalledWith(error)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('updates state for update failures', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await waitForNextUpdate()

    const update = jest.fn(() => Promise.resolve(false))
    act(() => {
      result.current[1].update(update)
    })

    await waitForNextUpdate()

    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].data).toBe(false)
    expect(result.current[0].error).toBe(null)
  })

  it('implements default update behaviour when no options passed', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await waitForNextUpdate()

    const error = new Error()
    const updateFail = jest.fn(() => Promise.reject(error))

    act(() => {
      result.current[1].update(updateFail, {saveError: true})
    })

    await waitForNextUpdate()

    expect(result.current[0].loading).toBe(false)
    expect(result.current[0].data).toBe(null)
    expect(result.current[0].error).toBe(error)
  })

  it('throws an error when rejecting with throw config', async () => {
    expect.assertions(1)

    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await waitForNextUpdate()

    const error = new Error()
    const updateFail = jest.fn(() => Promise.reject(error))

    try {
      await result.current[1].update(updateFail, {throwError: true})
    } catch (err) {
      expect(err).toBe(error)
    }
  })

  it('update works with promise instead of method argument', async () => {
    const call = jest.fn(() => Promise.resolve(true))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    await waitForNextUpdate()

    const onSuccess = jest.fn()

    act(() => {
      result.current[1].update(Promise.resolve(false), {onSuccess})
    })

    expect(onSuccess).not.toBeCalled()

    await waitForNextUpdate()

    expect(onSuccess).toHaveBeenCalledWith(false)
  })

  it('calls the async caller when returned refresh method is called', async () => {
    let count = 0
    const call = jest.fn(() => Promise.resolve(count++))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    expect(result.current[0].data).toBe(null)
    expect(call).toHaveBeenCalledTimes(1)

    await waitForNextUpdate()

    expect(result.current[0].data).toBe(0)

    act(() => {
      result.current[1].refresh()
    })

    expect(call).toHaveBeenCalledTimes(2)
    expect(result.current[0].data).toBe(0)
    expect(result.current[0].loading).toBe(true)

    await waitForNextUpdate()

    expect(result.current[0].data).toBe(1)
    expect(result.current[0].loading).toBe(false)
  })
})
