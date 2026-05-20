# Scope API Design Entity Naming

Status: ready-for-human
Type: AFK

## What to build

Make API Design-owned entity names explicit at shared and cross-module boundaries so they cannot be confused with app authentication, runtime resources, or generic schemas.

Keep product-facing terminology unchanged: users should still see Resource, Endpoint, Schema, and Auth Scheme in the editor. Keep physical database table names unchanged in this slice to avoid migration risk.

The top-level oRPC client shape should nest API Design child operations under the API Design namespace, for example `orpcTQ.apiDesign.resource.create` instead of `orpcTQ.resource.create`.

## Acceptance criteria

- [x] Shared DB TypeScript identifiers for API Design-owned tables are prefixed with `apiDesign`, including resources, endpoints, schemas, and auth schemes.
- [x] Shared row types use explicit API Design names, including `ApiDesignResourceRow`, `ApiDesignEndpointRow`, `ApiDesignSchemaRow`, and `ApiDesignAuthSchemeRow`.
- [x] Cross-module DTO types use explicit API Design names, including `ApiDesignResourceDto`, `ApiDesignEndpointDto`, `ApiDesignSchemaDto`, and `ApiDesignAuthSchemeDto`.
- [x] API Design child routers are exposed under `apiDesign`, so client calls use `orpcTQ.apiDesign.resource`, `orpcTQ.apiDesign.endpoint`, `orpcTQ.apiDesign.schema`, `orpcTQ.apiDesign.authScheme`, `orpcTQ.apiDesign.ai`, and `orpcTQ.apiDesign.export`.
- [x] Local implementation names may stay concise where API Design context is already obvious, such as `createResource`, `updateEndpoint`, UI labels, and object fields like `resources` and `authSchemes`.
- [x] Physical database table names are not renamed in this issue.
- [x] Domain documentation records that API Design entities are design-document entities, distinct from app authentication and runtime backend resources.
- [x] `npm run format`, `npm run typecheck`, `npm run lint`, and `npm run test` pass when run separately.

## Blocked by

None - can start immediately
