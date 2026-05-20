# base-ui Combobox: input-inside-popup pattern

The `@/shared/ui/combobox` wrapper has two patterns. When using the **input-inside-popup** pattern (Trigger wraps Value, Input lives inside Popup):

## Correct

```tsx
<Combobox items={items} value={selected} onValueChange={handleChange}
          isItemEqualToValue={...} itemToStringLabel={(s) => s.name}>
  <ComboboxTrigger aria-label="..." className="w-full">
    <ComboboxValue placeholder="Select…" />
  </ComboboxTrigger>
  <ComboboxContent>
    <ComboboxInput placeholder="Search…" showTrigger={false} />
    <ComboboxList>
      {(item) => (
        <ComboboxItem key={item.id} value={item}>
          {item.name}
        </ComboboxItem>
      )}
    </ComboboxList>
    <ComboboxEmpty>No results</ComboboxEmpty>
  </ComboboxContent>
</Combobox>
```

## Rules

- `ComboboxValue` uses `placeholder` prop only — `itemToStringLabel` on Root handles value display
- `ComboboxList` uses render-function (`{(item) => ...}`) — no manual `.map()` / `index`
- `ComboboxInput` inside popup needs `showTrigger={false}`
- `ComboboxTrigger` wraps `ComboboxValue` only — chevron is built-in
