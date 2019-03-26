# use-async-call

Provides an abstraction over the lower-level `use-async-reducer`, handles calls to `useEffect` and handles cancelation when the inputs change or components unmounts to avoid modifying stale data

## Install

```
npm install use-async-call
```

## Examples

### A component which updates a value at an API

```ts
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
  const [user, updateUser] = useAsyncCall<User>(fetchUser)

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
import React, {useCallback} from 'react'
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
  const [user, updateUser] = useAsyncCall<User>(fetchUser)

  const handleUpdateUser = useCallback(
    (userData: Partial<User>) => {
      return updateUser(Api.updateUser(userId, userData), {
        onSuccess: (user) => {
          alert('Update user!')
        },
        onFailure: (error) => {
          alert('Failed to update user')
        }
      })
    },
    [userId]
  )

  return [user, handleUpdateUser]
}
```

## Available actions

See `src/index.ts` for the the interface, all methods contain docs in types
