# ADR 0002: Database ORM

## Status

Accepted

## Context

API Builder needs a database layer for users, auth-linked accounts and sessions, workspaces, API designs, resources, endpoints, collaboration metadata, and exports.

The product is an early-stage Next.js and TypeScript application. The database layer should support strong typing, explicit schema ownership, migrations, server-side usage, auth integration, and long-term modeling of collaboration and permissions.

The main options considered were **Drizzle ORM** and **Prisma**.

## Decision

Use **Drizzle ORM** as the primary database access and migration layer.

Drizzle fits the project because it is lightweight, SQL-oriented, TypeScript-native, and gives direct control over schema and query behavior. This is useful for a collaborative API design product where the domain model is likely to grow around workspaces, permissions, versioning, exports, and audit-style metadata.

The expected database is PostgreSQL. Supabase is used as the Postgres platform only: local development can use the Supabase local stack, and hosted environments can use Supabase-managed Postgres. Supabase Auth, Storage, Realtime, generated APIs, and Supabase-owned migrations are not part of this decision.

Drizzle owns migrations. Supabase provides the database runtime and hosting surface, but Drizzle remains the source of truth for schema and migration files.

Record IDs use text values across auth, workspace, and product tables to align with Better Auth schemas. Physical database names use plural `snake_case`; TypeScript properties use `camelCase`. Timestamp columns use Postgres timezone-aware timestamps.

The first product-domain table is minimal and workspace-owned. When implementation naming is aligned with the product language, its table name should be `api_designs`. Full canvas/resource/endpoint modeling is deferred.

## Consequences

Positive consequences:

- Schema definitions stay close to SQL while remaining TypeScript-native.
- Query behavior is explicit and easier to inspect or optimize.
- Generated migrations can be reviewed as SQL.
- The app keeps strong control over auth tables, workspace tables, and product-domain tables.
- The runtime footprint is smaller than heavier ORM approaches.
- Local and hosted Postgres can share the same Drizzle migration path.

Negative consequences:

- Drizzle can be more verbose than Prisma for common CRUD and nested relational queries.
- Prisma has broader familiarity and a larger adapter/example ecosystem.
- The team will need discipline around schema organization, relation naming, and reusable query patterns.
- Auth integration should be checked against the selected auth library before implementation begins.
- Supabase migration commands are not the source of truth, which should be clear in setup docs and package scripts.

## Alternatives Considered

### Prisma

Prisma is a strong alternative with excellent generated types, productive CRUD ergonomics, Prisma Studio, mature migrations, and broad auth-adapter familiarity.

Prisma would be preferable if the team prioritizes fastest conventional CRUD development, broad onboarding familiarity, or adapter ecosystem convenience over SQL-level control.

It was not selected as the first choice because this product is likely to benefit from more direct SQL/schema control as collaboration, permissions, versioning, and export history become central.

### Raw SQL / Query Builder

Raw SQL or a lower-level query builder would provide maximum control.

It was not selected because early product velocity and type safety would be weaker without additional tooling.
