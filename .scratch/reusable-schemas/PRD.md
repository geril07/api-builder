Status: done

# PRD: Reusable Schemas

## Problem Statement

Developers designing REST APIs define the same request bodies and response shapes across multiple Endpoints. Today, `requestBody` and `responseShape` are raw textareas per Endpoint — every shape is duplicated inline. There is no way to define a schema once (e.g. `UserDto`, `ErrorResponse`) and reference it. Similarly, auth requirements are loose strings per Endpoint rather than defined security schemes referenced by name — violating OpenAPI conventions and making it easy to drift auth patterns across Endpoints.

## Solution

Introduce two new reusable entity types per API Design: **Schemas** (named JSON Schema definitions) and **Auth Schemes** (named security scheme definitions). Endpoints reference these entities instead of carrying duplicated inline text. The Export feature emits them into `#/components/schemas/` and `#/components/securitySchemes/` in the OpenAPI output, with proper `$ref` usage.

## User Stories

1. As an API designer, I want to define a named Schema (e.g. `UserDto`) once per API Design, so that I don't duplicate the same JSON shape across Endpoints.
2. As an API designer, I want to edit a Schema and have all Endpoints that reference it reflect the change, so that I can evolve my API design efficiently.
3. As an API designer, I want to reference a Schema as the request body of an Endpoint, so that the input contract is explicit and reusable.
4. As an API designer, I want to reference a Schema as the response shape of an Endpoint, so that the output contract is explicit and reusable.
5. As an API designer, I want to still write raw JSON inline for request body and response shape when a Schema doesn't exist yet or is one-off, so that I'm not forced into defining Schemas for every small shape.
6. As an API designer, I want to define named Auth Schemes (bearer token, API key, OAuth2) for my API Design, so that I model security consistently.
7. As an API designer, I want to select which Auth Schemes apply to an Endpoint from the defined set, so that my auth model is coherent and audit-able.
8. As an API designer, I want to see which Endpoints reference a Schema, so that I understand the blast radius before changing it.
9. As an API designer, I want the Export to emit Schemas into `#/components/schemas/` and Auth Schemes into `#/components/securitySchemes/` with correct `$ref`, so that the output is a standards-compliant OpenAPI 3.x spec.
10. As an API designer, I want the AI suggestions to optionally propose reusable Schemas alongside Resources and Endpoints, so that scaffolding includes shared definitions from the start.
11. As an API designer, I want to delete a Schema that is referenced by Endpoints and be warned (or blocked) about dangling references, so that I don't produce broken API Designs.
12. As an API designer, I want Schemas and Auth Schemes to be managed from the same sidebar as Resource and Endpoint editing, so that I stay in one editing context.
13. As an API designer, I want to see the Schema editor and Endpoint editor side by side, so that I can reference a Schema while filling out an Endpoint without context-switching.

## Implementation Decisions

### Database

- New table `schemas`:
  - `id` (uuid, PK), `api_design_id` (FK to api_designs, cascade delete)
  - `name` (text, not null) — unique per API Design
  - `description` (text, nullable)
  - `json_schema` (jsonb, not null) — the actual JSON Schema content
  - `created_at`, `updated_at` (timestamps)

- New table `auth_schemes`:
  - `id` (uuid, PK), `api_design_id` (FK to api_designs, cascade delete)
  - `name` (text, not null) — unique per API Design, matches OpenAPI security scheme name
  - `type` (text, not null) — one of `bearer`, `apiKey`, `oauth2`, `openIdConnect`
  - `config` (jsonb, not null) — type-specific configuration (scheme, bearerFormat, in, name, flows, etc.)
  - `created_at`, `updated_at` (timestamps)

- Modified table `endpoints`:
  - Add `request_body_schema_id` (uuid, nullable, FK to schemas, SET NULL on delete)
  - Add `response_shape_schema_id` (uuid, nullable, FK to schemas, SET NULL on delete)
  - Add `auth_scheme_ids` (jsonb, nullable, defaults to `[]`) — array of auth scheme UUIDs
  - Existing `request_body` and `response_shape` columns remain — used for inline raw JSON
  - Existing `auth_requirement` column removed (replaced by `auth_scheme_ids`)

### Schema reference semantics

- When an Endpoint has `requestBodySchemaId` set, Export uses `$ref: '#/components/schemas/...'`. The inline `requestBody` field is ignored for export (it can serve as a fallback or draft).
- When `requestBodySchemaId` is null, the inline `requestBody` string is used directly in export.
- Same rules apply for `responseShapeSchemaId` / `responseShape`.
- An Endpoint can reference multiple auth schemes via `authSchemeIds`. Export emits `security: [{ SchemeName: [] }, ...]`.

### Server

- Schema service: CRUD operations scoped to API Design ownership (checks Workspace access via the apiDesignId).
- Auth Scheme service: same pattern, same ownership checks.
- oRPC routers: `schema.create`, `schema.update`, `schema.delete` + `authScheme.create`, `authScheme.update`, `authScheme.delete`.
- List queries return schemas and auth schemes alongside the existing API Design data so the client gets everything in one query.
- Deleting a schema that is referenced by Endpoints: SET NULL on the FK column (no cascade). The Endpoint keeps its inline body/shape as a fallback, if any.

### Client / UI

- The sidebar panel grows two new tabs: **Schemas** and **Auth**.
- **Schemas tab**: list of all schemas in the API Design. Each row shows name + endpoint count badge. Click to open schema editor panel. "New schema" button. Delete with confirmation (warns if referenced).
  - Schema editor: name field, optional description, textarea for JSON Schema content (basic, no syntax highlighting yet). Validation: valid JSON on save.
- **Auth tab**: list of all auth schemes. Each row shows name + type badge. Click to edit. "New auth scheme" button. Delete with confirmation.
  - Auth scheme editor: name field, type selector (bearer/apiKey/oauth2/openIdConnect), type-specific config fields (simple key-value inputs).
- **Endpoint editor changes**:
  - Request Body section: add a combobox/select to pick a Schema (with "None — use inline" option). When a Schema is selected, the textarea shows the referenced schema content in read-only mode (or hides it). When "None" is selected, the existing editable textarea is shown.
  - Response Shape section: same pattern.
  - Auth Requirement section: replace free-text input with a multi-select checklist of defined auth schemes. No inline auth — only references.
- No canvas changes. Resources still render as nodes.

### Export

- Emit all Schemas into `components.schemas` keyed by name, each value is the `json_schema` content.
- Emit all Auth Schemes into `components.securitySchemes` keyed by name, each value is the `config` with `type` inlined (per OpenAPI spec).
- Endpoint with a schema ref emits `$ref: '#/components/schemas/SchemaName'` in the appropriate position.
- Endpoint with auth scheme refs emits `security: [{ SchemeName: [] }, ...]`.
- Inline request body and response shape (when no schema ref) behave as before: raw JSON wrapped in `content: { 'application/json': { schema: ... } }`.

### AI

- Extend the `suggestionSchema` zod schema to include an optional `schemas` array alongside `resources`. Each suggested schema has `name`, `description`, and `jsonSchema`. The AI can suggest schemas that Endpoints reference by name.
- The client-side AI panel presents suggested schemas as provisional items alongside suggested resources/endpoints, with accept/reject.

## Out of Scope

- Visual JSON Schema builder (tree editor, drag-and-drop schema composition). Textarea only.
- Schema syntax highlighting or validation beyond basic JSON parse.
- OpenAPI `parameters` (query/header/path params) as reusable schemas.
- OpenAPI `responses` (reusable response objects beyond the 200 shape).
- OpenAPI `examples` in schemas.
- Cross-API Design schema sharing or importing.
- Schema versioning or changelog.
- Auth scheme type-specific UI (OAuth2 flows editor, API key location picker beyond simple input fields).
- Test infrastructure (no test harness exists yet in the project).
- Canvas UX redesign (stays as ReactFlow nodes).
- Drag-and-drop schema referencing (picking schemas is dropdown/combobox only).

## Further Notes

- Schemas and Auth Schemes are per-API Design, not global. Two API Designs with a `UserDto` Schema are independent copies.
- Schema names must be unique within an API Design. Auth Scheme names must be unique within an API Design.
- The existing `endpointsTable.auth_requirement` column is a breaking change. A migration handles converting existing values to the new auth scheme ref model (or dropping them — user decides).
- The "both inline and ref" approach means the Endpoint DTO grows two extra nullable fields. The query/mutation pattern stays the same (optimistic updates, invalidate on settle).
- "Schema name" in the DB corresponds to the JSON Schema `$id` or key used in `components.schemas`, and doubles as the display name in the UI.
