# PRD: Multi-format Export with Dropdown Switcher

Status: ready-for-agent

## Problem Statement

The Export dialog currently only supports OpenAPI 3.0 (JSON/YAML). Users designing APIs want to export to other toolchain formats, starting with Postman Collections. The current dialog has a fixed title "OpenAPI Export" and a two-button YAML/JSON format toggle — adding a third option (Postman) as an additional button would conflate "export type" with "serialization format" and not scale to future formats like cURL or TypeScript clients.

## Solution

Replace the fixed OpenAPI dialog with a dropdown-switcher pattern (like GitHub's "Code ▼" button). A single button shows the current export type. Clicking it opens a popover listing available formats. Selecting a format changes the dialog body — title, description, format sub-options, preview, and actions all update per format.

The first two formats are:

- **OpenAPI** — existing behavior (YAML/JSON toggle, Generate, preview, Copy, Download as `openapi.{ext}`)
- **Postman Collection** — new (no format toggle, always JSON, Generate, preview, Copy, Download as `postman-collection.json`)

State is preserved per format: switching between OpenAPI and Postman keeps each type's previously generated content. Only dialog close resets everything.

## User Stories

1. As a user, I see a dropdown button at the top of the Export dialog showing the current export type (default: "OpenAPI") so I know which format I'm about to generate.
2. As a user clicking the dropdown, I see a list of available formats ("OpenAPI", "Postman Collection") so I can choose my target.
3. As a user selecting OpenAPI, the dialog shows the title "OpenAPI Export", a YAML/JSON format toggle, and a Generate button so I can produce the spec I need.
4. As a user selecting Postman Collection, the dialog shows the title "Postman Collection Export", no format toggle (always JSON), and a Generate button so I can produce a Postman-importable file.
5. As a user clicking Generate, the current API design is transformed into the selected format and the output string appears in a preview block.
6. As a user, I can Copy the generated output to clipboard.
7. As a user, I can Download the generated output as a file (openapi.yaml / openapi.json / postman-collection.json).
8. As a user switching between OpenAPI and Postman, my previously generated content for each format is preserved so I don't lose work.
9. As a user, when I close and reopen the dialog, all state resets.
10. As a user with bearer auth on my design, the Postman Collection includes a collection-level bearer auth block with a bearerToken variable placeholder.
11. As a user with API key auth, the Postman Collection includes collection-level apikey auth with key/in/value from my auth scheme config.
12. As a user with OAuth2 auth, the Postman Collection includes collection-level oauth2 auth with an accessToken variable placeholder.
13. As a user with path params (e.g. /users/{id}), the Postman request URL uses :id syntax.
14. As a user with query params on an endpoint, they appear as URL query parameters in the Postman request.
15. As a resource with no endpoints, it still appears as a folder in the Postman Collection with an empty item array.
16. As a user, I can import the downloaded Postman Collection JSON directly into Postman via File > Import and get a ready-to-use collection with all endpoints, auth, and variables preconfigured.

## Implementation Decisions

### Export type dropdown

**Dropdown button (GitHub "Code ▼" style).** Rationale: scales cleanly to more formats (cURL, TypeScript), separates "export type" from "serialization format", familiar UX.

### State management

Per-format state stored as separate React state variables:

- openapiFormat, openapiContent, openapiCopied
- postmanContent, postmanCopied

Tab switch: no state reset. Dialog close (onOpenChangeComplete): resets all.

### Postman Collection v2.1 structure

Generated JSON follows the Postman Collection v2.1 schema:

```json
{
  "info": {
    "name": "<designName>",
    "description": "",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "<ResourceName>",
      "item": [
        {
          "name": "<summary or METHOD /path>",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/users/:id",
              "host": ["{{baseUrl}}"],
              "path": ["users", ":id"]
            },
            "body": {},
            "description": "List users"
          },
          "response": []
        }
      ]
    }
  ],
  "auth": {},
  "variable": []
}
```

### Auth scheme to Postman auth mapping

| DB type       | Postman auth.type   | Details                                                                                                                |
| ------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| bearer        | "bearer"            | bearer: [{ key: "token", value: "{{bearerToken}}", type: "string" }], plus variable                                    |
| apiKey        | "apikey"            | apikey: [{ key, value: "{{apiKey}}", type: "string" }, { key: "in", value: config.in, type: "string" }], plus variable |
| oauth2        | "oauth2"            | oauth2: [{ key: "accessToken", value: "{{accessToken}}", type: "string" }], plus variable                              |
| openIdConnect | "oauth2" (fallback) | Same as oauth2                                                                                                         |

Collection-level auth applies to all requests. When multiple auth schemes exist across endpoints, the first one found is used.

### Modules to modify

- src/modules/api-design/export/service.ts — new PostmanCollectionV21 type, buildPostmanCollection() function, extend exportApiDesign() signature
- src/modules/api-design/export/orpc.ts — add 'postman' to format enum
- src/modules/api-design-editor/panels/export-dialog.tsx — rewrite to dropdown-switcher pattern with per-format state, add Postman tab body
- src/shared/i18n/messages/en.json — add translation keys
- src/shared/i18n/messages/ru.json — parallel Russian translations

### Dropdown UI pattern

The dropdown trigger is a Button showing current format name + chevron. Clicking opens a popover with two items (OpenAPI, Postman Collection). The project already has radix popover and a Command component.

### Download filename

OpenAPI YAML -> openapi.yaml, OpenAPI JSON -> openapi.json, Postman -> postman-collection.json

## Testing Decisions

### What to test

Test external behavior of the pure transformation function buildPostmanCollection(design). It is a pure function ideal for unit tests.

### Modules to test

- service.ts — buildPostmanCollection() unit tests
- orpc.ts — extend existing exportApiDesign test for 'postman' format

### Prior art

Existing tests in service.test.ts for buildOpenApiSpec() and serializeSpec() with 13 test cases. Same pattern for Postman: mock a DesignForExport, call buildPostmanCollection(), assert on the returned structure.

### Test cases for Postman

1. Minimal (empty) design — valid skeleton
2. Resources become folders
3. Endpoints mapped with correct method, url, path
4. Path params {id} -> :id
5. Query params in url.query
6. Inline request body -> body.mode === "raw"
7. Schema-ref request body -> resolved and serialized
8. Bearer auth -> auth.type === "bearer", variables
9. API key auth -> auth.type === "apikey", config mapping
10. Multiple resources produce multiple folders
11. Empty resource (no endpoints) -> empty item array

## Out of Scope

- Postman collection variables beyond baseUrl and auth placeholders
- Pre-request scripts or test scripts
- Response examples / mock responses
- One-click import into Postman (user downloads and imports manually)
- cURL export, TypeScript SDK export — deferred to future formats

## Further Notes

- The existing DesignForExport data shape already eager-loads all resources, endpoints (with auth scheme links), schemas, and auth schemes — sufficient for Postman without schema or query changes.
- The format enum on the server should be z.enum(['json', 'yaml', 'postman']). The 'postman' variant always returns JSON.
