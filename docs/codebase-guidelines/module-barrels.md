# Module Barrels

Use separate public entrypoints for client-safe and server-only module exports.

## Pattern

```text
modules/<name>/
  index.ts   client-safe exports only
  server.ts  server-only exports
```

## Rules

- `index.ts` uses `export *` from client-safe source files (types, constants, query keys, helpers).
- `index.ts` must not re-export services, procedures, DB code, or files with `server-only`.
- `server.ts` must start with `import 'server-only'`.
- `server.ts` uses `export * from './service'` and `export { router } from './orpc'`.
- oRPC routers are exported from `server.ts`, not `index.ts`.
- Client/UI code imports from `index.ts`; server/RPC code imports from `server.ts`.

## Example

```text
modules/api-design/
  index.ts          export * from './types'; export * from './query-keys'
  server.ts         export * from './service'; export { apiDesignRouter } from './orpc'
  types.ts
  query-keys.ts
  service.ts        (server-only)
  orpc.ts           (server-only)
```

```ts
// index.ts
export * from './types'
export * from './query-keys'
```

```ts
// server.ts
import 'server-only'

export * from './service'
export { apiDesignRouter } from './orpc'
```
