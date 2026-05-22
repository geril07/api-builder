# Postman Collection Export

Status: `ready-for-agent`

Export an API Design as a **Postman Collection v2.1** JSON file, so users can import it directly into Postman.

## Background

Currently the only export target is OpenAPI 3.0.3 (JSON/YAML). The export architecture lives in `src/modules/api-design/export/`:

- **`service.ts`** — `buildOpenApiSpec()` assembles an in-memory OpenApiSpec; `serializeSpec()` converts to string; `exportApiDesign()` is the DB-backed entry point
- **`orpc.ts`** — oRPC procedure accepting `{ apiDesignId, format: 'json' | 'yaml' }`
- **`export-dialog.tsx`** — UI with format toggle, Generate/Copy/Download

The DB model (`DesignForExport`) already eager-loads resources, endpoints (with auth scheme links), schemas, and auth schemes — the same data is sufficient for a Postman collection.

## Requirements

### Server (`service.ts`)

1. Add a new export function `buildPostmanCollection(design: DesignForExport): PostmanCollectionV21` that constructs a Postman Collection v2.1 object
2. Extend `exportApiDesign()` to accept `format: 'postman'` and dispatch to the new builder
3. The Postman format is JSON only (no YAML variant) — `serializeSpec` with `JSON.stringify` is sufficient

### Postman Collection v2.1 structure

The output should follow the [Postman Collection v2.1 schema](https://schema.postman.com/collection/json/v2.1.0/draft-07/collection.json):

```
{
  "info": {
    "name": "<apiDesignName>",
    "description": "<apiDesignDescription>",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "<ResourceName>",
      "item": [
        {
          "name": "<Endpoint summary or method+path>",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "{{baseUrl}}/users",
              "host": ["{{baseUrl}}"],
              "path": ["users"]
            }
          }
        }
      ]
    }
  ],
  "auth": { ... },
  "variable": [
    { "key": "baseUrl", "value": "http://localhost:3000" }
  ]
}
```

Key mappings from `DesignForExport`:

| Design entity         | Postman equivalent                                                        |
| --------------------- | ------------------------------------------------------------------------- |
| Resource              | Folder (top-level `item`)                                                 |
| Endpoint              | Request inside a folder `item`                                            |
| Endpoint path params  | URL path variables (`:id` syntax or `{{param}}`)                          |
| Endpoint query params | URL query params or Pre-request script                                    |
| Auth scheme           | Collection-level `auth` block                                             |
| Schema                | Not directly mapped (could be added as collection description or example) |

### Auth scheme mapping

- `bearer` → `auth.type: "bearer"`
- `apiKey` → `auth.type: "apikey"` with key/value in `auth.apikey`
- `oauth2` → `auth.type: "oauth2"` (basic grant type mapping)
- `openIdConnect` → skip or map to oauth2

### Procedure (`orpc.ts`)

Add `'postman'` to the format enum in the Zod schema.

### UI (`export-dialog.tsx`)

- Add a third tab "Postman" alongside YAML/JSON
- The Generate step calls the same mutation with `format: 'postman'`
- Download uses MIME type `application/json`, filename `<designName>-postman.json`
- Copy button works as before (copies the JSON string)

### Tests (`service.test.ts`)

Add test cases:

- Minimal design → valid Postman collection skeleton
- All endpoint methods mapped correctly
- Path params converted to Postman `:param` syntax
- Query params included
- Auth scheme mapped to collection auth
- Multiple resources produce multiple folders

## Not in scope

- Importing into Postman directly (user downloads and imports manually)
- Collection variables beyond `baseUrl`
- Pre-request scripts or test scripts
- Examples/response bodies

## Parent

.scratch/multi-export/PRD.md

---

This issue is superseded by the multi-export PRD which covers the full scope. The PRD contains the final implementation decisions (dropdown UI, per-format state, auth mapping, test cases). Refer to the PRD for implementation.
