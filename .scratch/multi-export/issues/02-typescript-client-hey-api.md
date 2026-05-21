# TypeScript SDK Client / Types with hey-api

Status: `ready-for-agent`

Generate a **TypeScript SDK** — typed client + schema types — from an API Design using `hey-api` (formerly openapi-typescript), so users can copy-paste or download a ready-to-use client.

## Background

The export service (`src/modules/api-design/export/service.ts`) already produces an in-memory OpenAPI 3.0.3 spec via `buildOpenApiSpec()`. The spec is currently serialized to JSON or YAML and returned as a string.

`hey-api` provides two complementary packages:

- **`@hey-api/openapi-ts`** — CLI / programmatic code generator that consumes an OpenAPI spec and outputs TypeScript types + a typed fetch client
- **`@hey-api/client-fetch`** — the runtime fetch wrapper the generated code depends on

The generator can run programmatically (not just CLI), which makes it suitable for a server-side API endpoint.

## Requirements

### Approach

The OpenAPI spec already exists as a JavaScript object in memory. The ideal flow:

```
buildOpenApiSpec(design) → openApiSpecObj
                           ↓
              @hey-api/openapi-ts (programmatic, in-memory)
                           ↓
              { types: "..." , client: "..." }
                           ↓
              return as downloadable artifact or inline code
```

### Server (`service.ts`)

1. Add `@hey-api/openapi-ts` and `@hey-api/client-fetch` as dependencies
2. Add a new export function `generateTypeScriptClient(design: DesignForExport): string` that:
   - Calls `buildOpenApiSpec(design)` to get the OpenAPI spec
   - Converts it to a temporary file or uses `@hey-api/openapi-ts`'s programmatic API with an in-memory input
   - Returns the generated TypeScript code as a string (or zip of multiple files)
3. Extend `exportApiDesign()` to accept `format: 'typescript'` and dispatch to the new builder

### `@hey-api/openapi-ts` programmatic usage

```ts
import { createClient } from '@hey-api/openapi-ts'

const output = await createClient({
  input: openApiSpecObj,  // the in-memory spec
  output: /* in-memory target */,
  client: '@hey-api/client-fetch',
  schemas: true,
  // etc.
})
```

If `@hey-api/openapi-ts` requires file I/O, write the spec to a temp file in `/tmp/`, run the generator, read back the output, and clean up.

### Output format

The generated output typically includes:

- `types.gen.ts` — TypeScript interfaces/types for all schemas
- `sdk.gen.ts` — Typed fetch functions for each endpoint
- `index.ts` — Re-exports

For a web tool, the options are:

1. **Single file concatenation** — merge all generated files into one downloadable `.ts` file
2. **Zip download** — use `jszip` to bundle multiple `.ts` files into a `.zip`
3. **Inline** — show the `sdk.gen.ts` content in a `<pre>` block (similar to current YAML/JSON display)

Start with option 3 (inline display, matching the existing UX), then consider a zip download.

### Procedure (`orpc.ts`)

Add `'typescript'` to the format enum in the Zod schema.

### UI (`export-dialog.tsx`)

- Add a tab "TypeScript" alongside YAML/JSON/Postman
- The Generate step calls the same mutation with `format: 'typescript'`
- Display the generated code in the existing `<pre>` block
- Copy button copies the code
- Download button saves as `<designName>-client.ts`
- MIME type: `text/typescript` or `text/plain`

### Tests

- Mock `@hey-api/openapi-ts` call and verify the generated code string is passed through
- Test that invalid specs produce helpful error messages

## Considerations

- `@hey-api/openapi-ts` may need Node.js file system access. Since this runs in a Next.js server context, it has access to `fs`. If the programmatic API is not in-memory, use `mkdtemp` + `fs.writeFileSync` + `fs.readFileSync` + `fs.rmSync`.
- The generator output might be large — consider streaming or chunking if performance is an issue.
- Version pin `@hey-api/openapi-ts` and `@hey-api/client-fetch` to avoid breaking changes.

## Not in scope

- Other client languages (Python, Go, Java, etc.)
- Runtime SDK delivery (npm package publishing)
- Custom client configuration beyond what hey-api's CLI supports
