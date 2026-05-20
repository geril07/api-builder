Status: ready-for-agent

# PRD: Endpoint Editor Reference Toggle

## Problem Statement

The Endpoint editor's Request Body and Response Shape sections merge two concerns into one control: a dropdown select with a "None — use inline" sentinel value. This causes two problems:

1. **Surprise overwrite**: Selecting a Schema from the dropdown immediately copies its content into the textarea, overwriting any inline work. The user didn't explicitly switch modes — they just clicked a dropdown.
2. **Stale reference display**: When a referenced Schema is deleted, the `<SelectValue>` renders the raw UUID instead of a label because no matching `<SelectItem>` exists. The `__none__` magic string sentinel is fragile and opaque.

## Solution

Replace the merged select+textarea pattern with an explicit two-mode toggle per section (Request Body and Response Shape). The user chooses **Inline** (editable textarea, raw JSON) or **Reference** (schema selector, read-only display). Exactly one mode is active at a time.

When an endpoint loads with a stale schema reference (the schema was deleted), the editor silently migrates to Inline mode — the textarea becomes editable with the last-known inline content preserved, and `requestBodySchemaId` / `responseShapeSchemaId` is set to null on the next save.

## User Stories

1. As an API designer, I want to see a clear toggle between Inline and Reference mode for Request Body and Response Shape, so that I know which mode I'm in at all times.
2. As an API designer, I want the textarea to be editable only in Inline mode, so that selecting a reference doesn't overwrite my work.
3. As an API designer, I want the schema selector to appear only in Reference mode, so that the UI is not cluttered with controls that don't apply.
4. As an API designer, I want the textarea to show the schema content read-only in Reference mode, so that I can preview what the reference resolves to.
5. As an API designer, when I switch from Inline to Reference, I want to be prompted to pick a schema before the textarea locks, so that I don't switch modes accidentally.
6. As an API designer, when I switch from Reference to Inline, I want the schema reference to be cleared (`requestBodySchemaId` set to null) and the textarea to become editable with the last content preserved, so that I can tweak the shape as a one-off.
7. As an API designer, when I open an endpoint that referenced a now-deleted schema, I want the editor to automatically show Inline mode with the textarea editable and the reference cleared on save, so that I'm not blocked by stale references.

## Implementation Decisions

### Two-mode toggle

Per section (Request Body, Response Shape):

- A segmented control `[Inline] [Reference]` appears right-aligned on the same row as the section label ("Request Body" / "Response Shape").
- **Inline mode**: A full-height editable textarea is shown. `requestBodySchemaId` / `responseShapeSchemaId` is null. No schema select is visible.
- **Reference mode**: A schema dropdown select is shown above a read-only textarea that displays the selected schema's content. The textarea has `readOnly` and reduced opacity styling. `requestBodySchemaId` / `responseShapeSchemaId` holds the selected schema's UUID.

### Mode transitions

- **Inline → Reference**: The schema select appears, empty. The user must pick a schema. Once picked, `requestBodySchemaId` is set, and the textarea fills with the schema content and locks. If the user hasn't picked a schema and switches back to Inline, nothing changes.
- **Reference → Inline**: `requestBodySchemaId` is set to null. The textarea becomes editable with the last content preserved (the schema's JSON that was shown read-only). The schema select disappears.

### Stale reference handling on load

When `endpoint.requestBodySchemaId` is non-null but no matching schema is found in the `schemas` array:

- Set local state to Inline mode.
- Keep the textarea content as-is (the last-known inline value from the server, or the original schema content that was previously copied inline).
- On the next save, `requestBodySchemaId: null` is sent to the server.

### Components modified

- **`endpoint-view.tsx`**: Replace the merged Select + Textarea sections for Request Body and Response Shape. Add the toggle, conditional rendering of select vs textarea, and stale reference detection + auto-migration.

### No changes

- Auth Schemes section (multi-select checklist) — unchanged.
- DB schema — unchanged. Both `request_body_schema_id` / `response_shape_schema_id` and `request_body` / `response_shape` columns coexist as before.
- Server/service layer — unchanged. The existing mutation interface already accepts both schema IDs and inline content.
- `__none__` sentinel — removed from the select. The toggle replaces it.

## Testing Decisions

No test infrastructure exists yet in this project. Out of scope.

## Out of Scope

- Auth scheme editor changes.
- Visual JSON Schema builder or syntax highlighting.
- Drag-and-drop schema referencing.
- Cross-API Design schema sharing.
- Schema versioning or changelog.

## Further Notes

- The toggle ADR has not been captured as a formal ADR — the decision is recorded here in the PRD. If future work revisits this pattern (e.g., adding it to other sections), an ADR may be warranted.
- This PRD supersedes the merged select+textarea UX described in the "Reusable Schemas" issue `03-endpoint-editor-upgrade.md` for the Request Body and Response Shape sections. All other acceptance criteria from that issue remain valid.
