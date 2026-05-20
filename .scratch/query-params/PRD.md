Status: ready-for-agent

# Query Parameters per Endpoint

## Problem Statement

API endpoints often accept query parameters (`?page=2&sort=name&filter=active`). Currently, the API Builder has no way to define, store, or export query parameters on endpoints — the endpoint model only covers method, path, summary, request body, response shape, and auth. Users designing APIs that use query parameters (pagination, sorting, filtering, etc.) cannot capture that intent and it is absent from OpenAPI exports.

## Solution

Add a `queryParams` field to the endpoint model — a JSON array of parameter objects. Each parameter has:

- `name` (required)
- `description` (optional)
- `required` (optional boolean, default false)
- `type` (optional, one of `string` | `number` | `integer` | `boolean`, default `string`)
- `allowMultiple` (optional boolean, default false — when true, the param is an array)

The endpoint editor sidebar gains a new "Query Parameters" section where users can add, edit, reorder, and delete params. The OpenAPI export maps these to the operation's `parameters` array with `in: query`.

## User Stories

1. As an API designer, I want to add query parameters to an endpoint, so that my API spec documents pagination, filtering, and sorting.
2. As an API designer, I want to set a query parameter as required, so that consumers know they must provide it.
3. As an API designer, I want to set a query parameter's type (string/number/integer/boolean), so that consumers know how to interpret the string value in the URL.
4. As an API designer, I want to toggle "allow multiple values" on a query parameter, so that consumers know they can pass `?id=1&id=2`.
5. As an API designer, I want to write a description for each query parameter, so that consumers understand its purpose.
6. As an API designer, I want to delete a query parameter from an endpoint, so that I can clean up stale params.
7. As an API designer, I want query parameters to appear in OpenAPI JSON and YAML exports, so that downstream tools generate correct docs/client code.
8. As an API designer, I want optimistic updates in the UI when adding/editing/deleting query params, so that the canvas feels responsive.

## Implementation Decisions

### Data model

- **DB column**: Add `query_params` as a `jsonb` column to `endpointsTable` with default `'[]'::jsonb`.
- **Type** (`QueryParamDto`):
  ```ts
  type QueryParamDto = {
    name: string
    description?: string | null
    required?: boolean
    type?: 'string' | 'number' | 'integer' | 'boolean'
    allowMultiple?: boolean
  }
  ```
- **EndpointDto**: Add `queryParams: QueryParamDto[]`
- **Zod input**: Add `queryParams` (optional, array of the above shape) to both create and update endpoint inputs.

### Backend modules

| File                              | Change                                         |
| --------------------------------- | ---------------------------------------------- |
| `src/shared/db/schema.ts`         | Add `queryParams` column to `endpointsTable`   |
| `src/modules/endpoint/types.ts`   | Add `QueryParamDto` type, extend `EndpointDto` |
| `src/modules/endpoint/service.ts` | Pass through `queryParams` in create/update    |
| `src/modules/endpoint/orpc.ts`    | Add `queryParams` to create/update Zod schemas |

### Export

In `src/modules/export/service.ts`, map each `QueryParamDto` to an OpenAPI parameter:

```ts
{
  name: param.name,
  in: 'query',
  description: param.description ?? undefined,
  required: param.required ?? false,
  schema: {
    type: param.allowMultiple ? 'array' : (param.type ?? 'string'),
    ...(param.allowMultiple && {
      items: { type: param.type ?? 'string' },
    }),
  },
  // explode: true is default for form style — matches allowMultiple semantics
}
```

### UI

Add a "Query Parameters" section to `endpoint-view.tsx` below the Summary field (or between Summary and Request Body). The section:

- Shows existing params as a list of rows, each row showing: name, type badge, required indicator, allowMultiple indicator
- Each row is editable inline or opens a sub-form
- "Add parameter" button appends a new row with defaults
- Remove button per row
- Changes commit on blur or explicit save (matching existing onBlur pattern)
- The section is collapsible by default when empty

A separate `QueryParamRow` component extracted to keep the endpoint view clean.

### Mutations

Extend `createEndpointMutationOptions` and `updateEndpointMutationOptions` in `mutations.ts` to include `queryParams` in optimistic paint. The field behaves like any other optional field on the endpoint.

### Migration

New Drizzle migration adding the column. No data backfill needed — default empty array covers existing rows.

## Testing Decisions

A good test for this feature verifies the external behavior (CRUD + export) without asserting private implementation. The deep module here is the **OpenAPI mapping** — given query params, produce the correct `parameters` array.

### Modules to test

| Module                            | What to test                                                                                  | Prior art                              |
| --------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------- |
| `src/modules/export/service.ts`   | Query params map to correct OpenAPI structure for each type, required/optional, allowMultiple | No existing export tests — this is new |
| `src/modules/endpoint/service.ts` | Query params persist through create and update round-trips                                    | No existing endpoint service tests     |
| `endpoint-view.tsx` (UI)          | Adding/editing/deleting params in the form                                                    | No existing UI component tests         |

Tests should be written for:

1. **Export mapping**: Given a `QueryParamDto[]`, the exported OpenAPI spec includes the correct `parameters` array on the operation.
2. **Service integration**: Creating an endpoint with query params, then fetching it, returns the same params.
3. **Service integration**: Updating an endpoint's query params (add, edit, remove) persists correctly.

UI tests are lower priority but the query param row component would be a good candidate once the test infrastructure is in place.

## Out of Scope

- Header parameters and cookie parameters — only query in scope
- Path parameters (e.g., `/users/:id`) — the path field remains a plain string
- Reusable parameter definitions (OpenAPI `components/parameters`) — all params are inline per-endpoint
- Deprecation of parameters
- `style` / `explode` / `allowReserved` — OpenAPI spec has these but they add significant UI complexity for marginal value in v1
- Parameter ordering drag-and-drop — simple up/down arrows or list-only for now
- AI agent support for creating/editing query params — the AI works on the full endpoint and can already manipulate arbitrary JSON fields, so it should work automatically; explicit support is deferred

## Further Notes

- The existing endpoint editor sidebar has no concept of query parameters. The new section should follow the visual style of the existing sections (label, collapsible border, consistent spacing).
- The column is named `query_params` (snake_case) following Drizzle convention in this project (see ADR-0002).
- Since no existing service tests exist in this repo, the testing section should be considered aspirational — the primary validation will be manual testing + existing lint/typecheck/test commands.
