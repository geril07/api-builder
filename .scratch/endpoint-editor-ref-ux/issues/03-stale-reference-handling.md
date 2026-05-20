Status: done

# 03 - Stale reference detection + auto-migration

## What to build

When an Endpoint loads and `requestBodySchemaId` or `responseShapeSchemaId` points to a Schema that no longer exists in the `schemas` array (e.g. the Schema was deleted), the editor should auto-migrate to Inline mode:

- Set local state to Inline for the affected section.
- Keep the textarea content as-is (the last-known inline value from the server, which may be the original schema content that was previously copied inline).
- On the next save, send `requestBodySchemaId: null` (or `responseShapeSchemaId: null`), effectively clearning the stale reference.
- No UI warning or blocking — the migration is silent.

This affects the initial state setup in `endpoint-view.tsx` at the `useEffect` that resets form state on endpoint change (`prevId` guard).

## Acceptance criteria

- [ ] When endpoint loads with `requestBodySchemaId` set but no matching schema in `schemas`, mode defaults to Inline
- [ ] Textarea shows the last-known inline content, editable
- [ ] On next save, `requestBodySchemaId: null` is sent to the server
- [ ] Same behavior for `responseShapeSchemaId`
- [ ] No error state or visible warning — silent migration

## Blocked by

- #02 — Response Shape toggle + both modes
