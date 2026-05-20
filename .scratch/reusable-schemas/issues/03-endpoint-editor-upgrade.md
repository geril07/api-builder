Status: done

# 03 - Endpoint Editor Upgrade

## What to build

Add schema reference and auth scheme reference fields to endpoints (DB migration + DTO), then update the Endpoint editor in the sidebar to support selecting schemas for request body and response shape, and selecting auth schemes for security — replacing the old free-text auth requirement.

The endpoint editor's Request Body and Response Shape sections each gain a combobox/select to pick a Schema. When a Schema is selected, the textarea becomes read-only (showing referenced schema content). When "None — use inline" is selected, the existing editable textarea is shown for raw JSON input. Schema ref takes precedence over inline for export.

The Auth Requirement section replaces the free-text input with a multi-select checklist of all defined auth schemes. Selecting one or more sets the endpoint's auth_scheme_ids. The old auth_requirement column is dropped.

## Acceptance criteria

- [ ] Migration adds `request_body_schema_id` (uuid, nullable, FK to schemas ON DELETE SET NULL), `response_shape_schema_id` (uuid, nullable, FK to schemas SET NULL), and `auth_scheme_ids` (jsonb, nullable, defaults to `[]`)
- [ ] Migration drops `auth_requirement` column from endpoints table
- [ ] Endpoint DTO updated: new optional fields requestBodySchemaId, responseShapeSchemaId, authSchemeIds (string array); requestBody/responseShape preserved for inline; authRequirement removed
- [ ] Endpoint CRUD service accepts and persists the new fields
- [ ] Endpoint editor (sidebar > EndpointView component) Request Body section:
  - Schema dropdown populated from the API Design's schemas, with "None — use inline" option
  - When a Schema is selected: textarea shows schema content as read-only. Saving persists the reference.
  - When "None" is selected: editable textarea for raw JSON as before. Saving persists inline value.
- [ ] Response Shape section: same dropdown + inline fallback behavior as Request Body
- [ ] Auth Requirement section: replaced with multi-select checklist of defined auth schemes (checkboxes per scheme name). Saving persists authSchemeIds array.
- [ ] Optimistic updates for endpoint mutations handle new fields
- [ ] When navigating between endpoints, form state resets correctly for new fields
- [ ] No regression on existing endpoint creation/editing (method, path, summary still work)

## Blocked by

- #01 - Schema Management
- #02 - Auth Scheme Management
