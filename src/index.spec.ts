import {renderHook, cleanup, act} from 'react-hooks-testing-library'

import useArrayState from '.'

afterEach(cleanup)

describe('use-array-state', () => {
  describe('actions.push', () => {
    it('appends a new element to an array', () => {
      const {result} = renderHook(() => useArrayState())

      expect(result.current[0]).toEqual([])

      act(() => {
        result.current[1].push(1)
      })

      expect(result.current[0]).toEqual([1])
    })
  })
})
