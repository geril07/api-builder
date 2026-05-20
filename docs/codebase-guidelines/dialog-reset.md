# Dialog reset in `onOpenChangeComplete`

Reset dialog state (inputs, loading, errors) in `onOpenChangeComplete`, not `onOpenChange`. Base UI fires `onOpenChangeComplete` after the close animation finishes, so resetting there avoids visual flicker.

## Problem

```tsx
<Dialog
  open={isOpen}
  onOpenChange={(open) => {
    setIsOpen(open)
    if (!open) resetState() // resets mid-animation → flicker
  }}
>
```

## Fix

```tsx
<Dialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onOpenChangeComplete={(open) => {
    if (!open) resetState() // resets after close animation
  }}
>
```

`onOpenChange` should only manage the `isOpen` boolean. All state resets go in `onOpenChangeComplete`.
