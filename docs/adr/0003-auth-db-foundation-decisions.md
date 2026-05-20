# ADR 0003: Auth and Database Foundation Decisions

## Status

Accepted

## Context

The auth and database foundation needs to support the first product implementation without over-building future collaboration, organization, or API-modeling features.

This record captures implementation-level decisions that refine the auth and ORM ADRs.

## Decision

The foundation uses three separate responsibilities:

- **Supabase** provides Postgres only.
- **Drizzle** owns schema, queries, and migrations.
- **Better Auth** owns authentication flows and sessions.

Supabase Auth, Supabase Storage, Supabase Realtime, Supabase-generated APIs, and Supabase-owned migrations are not part of the foundation.

## Implementation Decisions

- Local development can use the Supabase local stack for Postgres.
- Hosted environments can use Supabase-managed Postgres.
- Drizzle migrations are the source of truth for database changes.
- Resend is the email provider for magic links and future invitation emails.
- Supported sign-in methods are GitHub OAuth, Google OAuth, and email magic link.
- Password authentication is not included.
- Verified same-email identities should link into the same user when supported safely.
- Better Auth default session behavior is accepted for now.
- Every user gets a personal workspace on first sign-in.
- No starter API design is created on first sign-in.
- Product routes live under `/dashboard`.
- Public auth entrypoint is `/sign-in`.
- `Sign in` and `Sign up` both route to `/sign-in`.
- `/dashboard` is protected with a server layout redirect first.
- The public landing header is session-aware.
- Environment variables are documented in `.env.example`; local secret files are not committed.
- Minimal environment validation uses Zod.
- IDs use text values across auth, workspace, and product tables.
- Database tables use plural `snake_case` names.
- Database columns use `snake_case`; TypeScript properties use `camelCase`.
- Timestamp columns use Postgres timezone-aware timestamps.
- The first product-domain table is minimal and workspace-owned; when implementation naming is aligned with the product language, it should use `api_designs`.

## Consequences

These decisions keep the first implementation small while preserving the expected workspace-based product model.

The main tradeoff is that the project owns more application-level authorization and setup than it would with a fully managed auth platform. This is accepted because user, workspace, API design, and collaboration identity are core product concepts.
