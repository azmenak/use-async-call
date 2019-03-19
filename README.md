# use-async-reducer

An unoppininated hook to help manage async actions in React

## Install

```
npm install use-async-reducer
```

## Useage

```ts
import {useEffect} from 'react'
import useAsyncReducer from 'use-async-reducer'

function DataLoadingComponent({id}) {
  const [response, actions] = useAsyncReducer()

  useEffect(() => {
    const fetchData = async () => {
      actions.request()
      try {
        actions.success(await Api.fetchUser(id))
      } catch (error) {
        action.failure(error)
      }
    }
  }, [id])

  return (
    <>
      {response.loading && <div>Loading...</div>}
      {response.data && <div>{response.data.user.name}</div>}
      {response.error && <div>{response.error.message}</div>}
    </>
  )
}
```
