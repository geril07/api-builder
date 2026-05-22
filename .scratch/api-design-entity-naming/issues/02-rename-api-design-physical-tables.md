# Rename API Design Physical Tables

Status: done
Type: AFK

## What to build

Rename the physical database tables for API Design-owned entities so their storage names match their API Design ownership. This should be a schema-clarity migration only: existing data and application behavior must be preserved.

Rename `resources`, `endpoints`, `schemas`, and `auth_schemes` to API Design-prefixed table names. Rename related indexes, check constraints, and foreign key constraints where practical so database object names consistently use `api_design_*` terminology.

Inspect the generated migration before applying it. The migration must preserve data and must not use destructive drop/create operations for the renamed tables.

## Acceptance criteria

- [x] The `resources` table is renamed to `api_design_resources`.
- [x] The `endpoints` table is renamed to `api_design_endpoints`.
- [x] The `schemas` table is renamed to `api_design_schemas`.
- [x] The `auth_schemes` table is renamed to `api_design_auth_schemes`.
- [x] Related indexes, check constraints, and foreign key constraints are renamed where practical to use `api_design_*` naming.
- [x] Existing API Designs still load with their Resources, Endpoints, Schemas, and Auth Schemes intact.
- [x] Existing Endpoint references to Schemas and Auth Schemes continue to work after the migration.
- [x] The generated migration is inspected and confirmed to preserve data with rename-style operations rather than destructive drop/create operations.
- [x] No endpoint/auth-scheme join table changes are included in this issue.
- [x] `npm run format`, `npm run typecheck`, `npm run lint`, and `npm run test` pass when run separately.

## Blocked by

- `.scratch/api-design-entity-naming/issues/01-scope-api-design-entity-naming.md`
