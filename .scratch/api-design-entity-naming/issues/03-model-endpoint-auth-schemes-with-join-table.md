# Model Endpoint Auth Schemes With Join Table

Status: done
Type: AFK

## What to build

Replace the Endpoint-to-Auth Scheme JSONB ID array with a real many-to-many relationship. Endpoints should reference API Design Auth Schemes through a join table, while the application DTO/API shape continues to expose `authSchemeIds: string[]` to avoid UI churn.

Add an `api_design_endpoint_auth_schemes` table with `endpoint_id` and `auth_scheme_id` foreign keys, backfill it from the existing endpoint auth scheme ID data, update reads and writes to use the join table, then remove the old `auth_scheme_ids` column from API Design Endpoints.

## Acceptance criteria

- [x] A join table named `api_design_endpoint_auth_schemes` exists.
- [x] The join table has `endpoint_id` referencing `api_design_endpoints.id` with `ON DELETE CASCADE`.
- [x] The join table has `auth_scheme_id` referencing `api_design_auth_schemes.id` with `ON DELETE CASCADE`.
- [x] The join table prevents duplicate Endpoint/Auth Scheme references, for example with a composite primary key on `endpoint_id` and `auth_scheme_id`.
- [x] Existing values from `api_design_endpoints.auth_scheme_ids` are backfilled into the join table.
- [x] API Design reads still return Endpoint DTOs with `authSchemeIds: string[]`.
- [x] Creating an Endpoint with Auth Schemes writes relationship rows to the join table.
- [x] Updating an Endpoint's Auth Schemes replaces relationship rows in the join table.
- [x] Deleting an Auth Scheme removes related join rows via cascade; manual JSONB cleanup is removed.
- [x] OpenAPI export still emits endpoint security requirements from `authSchemeIds` correctly.
- [x] The old `auth_scheme_ids` column is removed from API Design Endpoints.
- [x] No orphan Auth Scheme references can exist at the database level.
- [x] `npm run format`, `npm run typecheck`, `npm run lint`, and `npm run test` pass when run separately.

## Blocked by

- `.scratch/api-design-entity-naming/issues/02-rename-api-design-physical-tables.md`
