Status: done

# 01 - Request Body toggle + both modes

## What to build

Replace the merged select+textarea for Request Body in the Endpoint editor with a segmented control `[Inline] [Reference]` right-aligned on the "Request Body" label row.

- **Inline mode**: Only the editable textarea is shown. No schema select. `requestBodySchemaId` is null.
- **Reference mode**: A schema dropdown select appears above a read-only textarea that displays the selected schema's JSON content. `requestBodySchemaId` is set to the selected schema's UUID.
- **Inline → Reference**: Schema select appears, empty. User picks a schema → textarea fills and locks. If user switches back before picking, nothing changes.
- **Reference → Inline**: `requestBodySchemaId` is set to null. Textarea becomes editable with last content preserved. Schema select disappears.
- Remove the `__none__` sentinel value and `'__none__'` string comparisons from the Request Body handler.
- Clear stale `selectedRequestBodySchema` concept — the toggle replaces it.

## Acceptance criteria

- [ ] Segmented control `[Inline] [Reference]` appears right-aligned next to "Request Body" label
- [ ] Inline mode shows only an editable textarea (no schema select)
- [ ] Reference mode shows a schema select dropdown + read-only textarea with schema content
- [ ] Selecting a schema in Reference mode fills the textarea and persists both `requestBodySchemaId` and `requestBody`
- [ ] Switching to Inline clears `requestBodySchemaId`, preserves textarea content, makes it editable
- [ ] Switching to Reference without picking a schema keeps textarea as-is, does not persist
- [ ] No `__none__` sentinel in code for Request Body
- [ ] Textarea on-blur save still works in Inline mode
- [ ] Textarea is `readOnly` with reduced opacity styling in Reference mode

## Blocked by

None — can start immediately.
