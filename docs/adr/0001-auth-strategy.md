# ADR 0001: Auth Strategy

## Status

Accepted

## Context

API Builder needs authentication for user-owned API designs, collaboration identity, workspace membership, and future invitation flows.

Required authentication methods:

- GitHub OAuth.
- Google OAuth.
- Email magic link.

Likely future requirements:

- Team and workspace accounts.
- Stable user identity for labeled collaboration cursors.
- Secure session handling.
- Invitation links.
- Workspace-level roles and permissions.

The main tradeoff is between implementation speed, data ownership, extensibility, security burden, and vendor lock-in.

## Decision

Use **Better Auth** as the primary authentication library, backed by the application database.

The authentication model will keep canonical user, session, account, organization, and membership data in the project database. OAuth providers will cover GitHub and Google. Magic links will use Resend.

Better Auth is a strong fit because it supports a modern TypeScript/Next.js application model while keeping identity data application-owned. Its organization/team capabilities also map well to the product's likely workspace model.

Every user receives a personal workspace on first sign-in. Product routes live under `/dashboard` and are protected by a server layout redirect. Public auth entrypoints use a dedicated `/sign-in` page, and both sign-in and sign-up actions lead to that page.

## Consequences

Positive consequences:

- User and workspace data remain owned by the application.
- Authentication can integrate directly with API designs, exports, collaboration presence, and permissions.
- OAuth and magic-link flows do not need to be built from scratch.
- The organization/team model gives a path toward workspaces, roles, and invitations.
- The UI can remain fully custom and aligned with the product design system.
- Verified same-email identities can link across Google, GitHub, and magic-link sign-in.

Negative consequences:

- The project owns more setup and operational responsibility than with a managed service.
- Email deliverability, session configuration, provider configuration, and abuse handling still require care.
- Better Auth is newer than Auth.js and managed providers such as Clerk.
- Workspace authorization remains an application-domain concern, not something solved entirely by auth.
- Supabase Auth is intentionally not used, even though Supabase is used as the Postgres platform.

## Alternatives Considered

### Auth.js / NextAuth

Auth.js is mature, widely used, and has strong Next.js support. It supports GitHub OAuth, Google OAuth, and email magic links through database-backed adapters.

It was not selected as the first choice because workspace, team, invitation, and role concepts would need more custom domain modeling from the start.

### Clerk

Clerk offers excellent Next.js integration, hosted UI, organizations, sessions, and fast implementation speed.

It was not selected because it introduces more vendor lock-in and makes identity data primarily managed outside the application database. It remains the best fallback if launch speed and managed auth operations become more important than data ownership.

### Supabase Auth

Supabase Auth is attractive if the project adopts Supabase broadly for Postgres and backend infrastructure.

It was not selected as a standalone auth choice because workspace authorization and product-domain modeling would still be application-owned.

### Auth0

Auth0 is strong for enterprise identity, SSO, compliance, and complex OAuth/OIDC requirements.

It is heavier than needed for the current product stage.

### DIY Auth

Custom authentication gives maximum control but carries high security and maintenance risk, especially for OAuth, magic links, session management, token expiry, and abuse prevention.

It was rejected for this stage.
