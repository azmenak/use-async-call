import {renderHook, cleanup} from 'react-hooks-testing-library'

import useAsyncCall from '.'

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

    expect(result.current.data).toBe(null)
    expect(call).toHaveBeenCalled()

    await waitForNextUpdate()

    expect(result.current.data).toBe(true)
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

  it('sets the error in response after rejection', async () => {
    const err = new Error()
    const call = jest.fn(() => Promise.reject(err))
    const {result, waitForNextUpdate} = renderHook(() => useAsyncCall(call))

    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)
    expect(call).toHaveBeenCalled()

    await waitForNextUpdate()

    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(err)
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
})
