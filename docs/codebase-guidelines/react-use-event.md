# useEvent

`useEvent` from `@/shared/reactuse` returns a stable callback that always calls the latest provided function via a ref.

## When to use

- When you need stable reference for a function

## Example

```tsx
const handleClick = useEvent(() => {
  onEndpointClick(resourceId, endpoint.id)
})

return <div onClick={handleClick} />
```

## Why not `useCallback` with deps?

`useCallback` recreates the function when deps change, which would still cause re-renders of children. `useEvent` never recreates the function — it keeps the identity stable forever and always reads the latest values through a ref.
