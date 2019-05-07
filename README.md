# use-async-call

![npm](https://img.shields.io/npm/v/use-async-call.svg)
[![codecov](https://codecov.io/gh/azmenak/use-async-call/branch/master/graph/badge.svg)](https://codecov.io/gh/azmenak/use-async-call)
[![Build Status](https://travis-ci.org/azmenak/use-async-call.svg?branch=master)](https://travis-ci.org/azmenak/use-async-call)
![NPM](https://img.shields.io/npm/l/use-async-call.svg)

Provides an abstraction over the lower-level [`use-async-reducer`](https://github.com/azmenak/use-async-reducer), handles calls to `useEffect` and handles cancelation when the inputs change or components unmounts to avoid modifying stale data

## Install

```
npm install use-async-call
```

## Usage

```ts
import useAsyncCall from 'use-async-call'

const [state, {update, refresh, actions}] = useAsyncCall(
  asyncCreator,
  (options = {})
)
```

### Demo

[![Edit use-async-call Basic Demo](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/mo51y75rzx?fontsize=14)

### Params

- `asyncCreator` An async method (returns a promise), create this method with `useCallback` if it depends on state from the component

```ts
const [searchText, setSearchText] = useState('')
const fetchData = useCallback(() => Api.search(searchText), [searchText])
```

- `options`

```ts
interface UseAsyncCallOptions<T> {
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
```

### Return values

- `state` an object containing state of async call

```ts
const state: Loadable = {
  data: {}, // any data
  loading: false, // true when calls in progress
  error: null // instance of Error if calls throw
}
```

- `update(asyncUpdater, updateOptions = {})` method used to update the state

  - `asyncUpdater` either a promise or a method which returns a promise, the result will be set to the `data` value of the state
  - `updateOptions`

  ```ts
  interface UseAsyncCallUpdateOptions<T> {
    /**
     * Should thrown errors be re-thrown in the resulting promise from `update`;
     * useful when using in conjuction with form libraries that expect errors
     * when submitting form values
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
  ```

- `refresh` method used to re-call the method passed to `useAsyncCall`

- `actions` action methods created by [`use-async-reducer`](https://github.com/azmenak/use-async-reducer)

```ts
interface AsyncReducerBoundActions<T = any> {
  /**
   * To be called at the beginning of a request, sets `loading` to `true`
   */
  request(): void
  /**
   * To be called with the data to be saved into the state
   * @param payload Result of the async call
   */
  success(payload: T): void
  /**
   * To be called when the async call fails
   * @param error
   */
  failure(error: Error): void
  /**
   * Can be called when a call fails/complete and the result is being discarded
   */
  complete(): void
}
```

## Examples

### Basic Example

```tsx
import React, {useCallback} from 'react'
import useAsyncCall from 'use-async-call'

import Api from './custom-api'

const DataLoadingComponent: React.FC<{id: number}> = ({id}) => {
  const fetchData = useCallback(() => Api.fetchModelData(id), [id])

  const [model] = useAsyncCall(fetchData)

  // model is now managed, it will automatically fetch new data when `id` prop
  // changes and update the state to reflect any changes
}
```

### A component which updates a value at an API

```tsx
import React, {useCallback} from 'react'
import useAsyncCall from 'use-async-call'

import Api from './custom-api'

interface User {
  id: number
  name: string
}

const UserProfile: React.FC<{userId: number}> = ({userId}) => {
  const [name, setName] = useState('')

  const fetchUser = useCallback(() => Api.fetchUserById(userId), [userId])
  const [user, {update: updateUser}] = useAsyncCall<User>(fetchUser)

  const handleUpdateUserName = useCallback((): Promise<User> => {
    return Api.updateUser(userId, {name})
  }, [userId, name])

  return (
    <div>
      <h1>User: {userId}</h1>
      {user.loading && <div>Loading...</div>}
      {user.data && <div>{user.data.name}</div>}
      {user.error && <div>{user.error.message}</div>}

      {user.data && (
        <>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <button
            disabled={user.loading}
            onClick={() => updateUser(handleUpdateUserName)}
          >
            Update Name
          </button>
        </>
      )}
    </div>
  )
}
```

### Create a custom hook to load and update a model

```ts
import {useCallback} from 'react'
import useAsyncCall, {Loadable} from 'use-async-call'

import Api from './custom-api'

interface User {
  id: number
  name: string
}

export function useUserData(
  userId: number
): [Loadable<User>, (userData: Partial<User>) => Promise<User>] {
  const fetchUser = useCallback(() => Api.fetchUserById(userId), [userId])
  const [user, {update: updateUser}] = useAsyncCall<User>(fetchUser)

 }, [])
  const handleUpdateUser = useCallback(
    (userData: Partial<User>) => {
      return updateUser(Api.updateUser(userId, userData), {
        onSuccess() {
          alert('Updated user!')
        },
        onFailure() {
          alert('Failed to update user')
        }
      })
    },
    [userId]
  )

  return [user, handleUpdateUser]
}
```

### Get Data from a Search API

```tsx
import React, {useCallback, useState} from 'react'
import useAsyncCall from 'use-async-call'

import SearchApi from './search-api'

export function useSearchData(searchText: string) {
  const fetchData = useCallback(() => SearchApi.find(searchText), [searchText])

  return useAsyncCall(fetchData, {dontReinitialize: true})
}

const SearchComponent: React.FC = () => {
  const [searchText, setSearchText] = useState('')
  const [searchData] = useSearchData(searchText)

  return (
    <>
      <input
        value={searchText}
        onChange={(event) => {
          setSearchText(event.target.value)
        }}
      />
      {searchData.data && (
        <>
          <h1>Search Results</h1>
          <ul>
            {searchData.data.map((searchResult) => (
              <li key={searchResult.id}>{searchResult.name}</li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}
```
