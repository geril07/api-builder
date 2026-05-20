# React useMemo / useCallback

Don't wrap trivial computations in `useMemo` or trivial handlers in `useCallback`. The overhead of the hook (dependency comparison, closure creation) exceeds the benefit.

## Rules

- **Use `useMemo` / `useCallback` when a stable reference is required** — e.g. a function is passed as a prop to a `React.memo` child, or a value is in a `useEffect` / `useCallback` dependency array where instability would cause infinite loops or wasted work.
- **No `useMemo` for a simple `.find()` / `.filter()` / `.map()`** — these are O(n) on small arrays. The dependency comparison is more expensive than the computation.
- **No `useMemo` for values consumed only as initial state** (e.g. `useNodesState(useMemo(...))`) — the value is read once on mount. The `useMemo` recomputes on every dep change for no reason.
- **No `useCallback` with `[]` deps** that only calls stable state setters — `useState` setters are already stable references. Use a plain function instead.

## Examples

### Bad

```tsx
const selectedResource = useMemo(
  () => resources.find((r) => r.id === selectedNodeId) ?? null,
  [resources, selectedNodeId],
)

const handleClose = useCallback(() => {
  setOpen(false)
}, [])
```

### Good

```tsx
const selectedResource = resources.find((r) => r.id === selectedNodeId) ?? null

function handleClose() {
  setOpen(false)
}
```
