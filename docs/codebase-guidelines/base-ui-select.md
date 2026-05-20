# base-ui Select: value vs label

`@base-ui/react/select`'s `<SelectValue>` renders the raw `value` prop, not the `<SelectItem>` children text. To show a label instead of the UUID, pass a render function as children.

## Problem

```tsx
<SelectValue /> // renders the raw UUID: "a1b2c3d4-..."
```

## Fix

```tsx
<SelectValue placeholder="Select a schema…">
  {(v: string | null) => {
    if (!v) return null
    return schemas.find((s) => s.id === v)?.name ?? v
  }}
</SelectValue>
```

The render function receives the current value. Map it to a display label. Return `null` when no value is selected (placeholder shows instead).
