Status: done

# 02 - Response Shape toggle + both modes

## What to build

Same pattern as Issue #01 applied to the Response Shape section of the Endpoint editor. Add a segmented control `[Inline] [Reference]` right-aligned on the "Response Shape" label row, with the same mode behavior and transitions.

Refactor the shared pattern into a reusable local helper or inline duplicated logic — whichever is simpler given the existing component structure. Both sections live in the same file (`endpoint-view.tsx`), so duplication is acceptable if extracting a helper adds complexity.

## Acceptance criteria

- [ ] Segmented control `[Inline] [Reference]` right-aligned next to "Response Shape" label
- [ ] Inline mode: editable textarea only (no schema select)
- [ ] Reference mode: schema select dropdown + read-only textarea with schema content
- [ ] Mode transitions match Issue #01 behavior
- [ ] No `__none__` sentinel in code for Response Shape
- [ ] Textarea on-blur save works in Inline mode
- [ ] Textarea is `readOnly` with reduced opacity styling in Reference mode

## Blocked by

- #01 — Request Body toggle + both modes
