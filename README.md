# use-array-state

A simple helper to makes changes to an array without needing to worry about mutating the value

## Install

```
npm install use-array-state
```

## Useage

```ts
import useArrayState from 'use-array-state'

function ArrayComponent () {
  const [value, valueActions] = useArrayState()

  return (
    <div>
      <button onClick={() => {valueActions.push('new-value')}}
      <pre>
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}
```

## Available actions

See `src/index.ts` for the the interface, all methods contain docs in types
