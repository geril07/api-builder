Status: done

# PRD: Account and Workspace

## Problem Statement

Developers need a secure, personal area to own and organize their API designs without the friction of password management.

## Solution

Passwordless authentication (GitHub OAuth, Google OAuth, email magic-link) with automatic personal Workspace creation on first sign-in. Each user gets an isolated Workspace that owns their API Designs.

## User Stories

1. As a new developer, I want to sign in with my existing GitHub or Google account, so that I can start designing APIs without creating yet another password.
2. As a new developer, I want to sign in with a magic link sent to my email, so that I can use the product even without GitHub or Google.
3. As a new user, I want a personal Workspace created automatically when I first sign in, so that I can start creating API Designs immediately.
4. As an authenticated user, I want to land on `/dashboard` after sign-in, so that I can see my Workspace and API Designs right away.
5. As an unauthenticated visitor, I want to be blocked from accessing `/dashboard`, so that my work is protected.
6. As a user, I want Sign in and Sign up treated as the same entrypoint, so that I don't have to think about which flow to pick.
7. As a Workspace owner, I want to see my Workspace as an implicit container for my API Designs, so that I'm not distracted by workspace management UI.

## Implementation Decisions

- Authentication via Better Auth with GitHub, Google, and email magic-link providers.
- Each user gets a personal Workspace (mapped to Better Auth's `organizations` table but surfaced as "Workspace" throughout the product).
- Workspace is created on first sign-in. No manual workspace creation flow.
- All authenticated routes live under `/dashboard`.
- Middleware or route protection ensures unauthenticated users are redirected to sign-in.
- No password auth — only passwordless flows.

## Testing Decisions

- Test each auth provider's sign-in flow end-to-end (Playwright or equivalent browser tests).
- Verify Workspace existence after first sign-in for each provider.
- Verify `/dashboard` redirects unauthenticated users to sign-in.
- Verify authenticated users can reach `/dashboard`.
- Tests should only exercise external behavior (sign-in, redirect, workspace presence), not internal auth state management.

## Out of Scope

- Password authentication.
- Workspace invitations or multi-member Workspaces.
- Role-based permissions beyond basic ownership.
- Enterprise SSO (SAML, OIDC).
- Billing or subscription management.
- Workspace switching UI.

## Further Notes

- The DB table `organizations` is inherited from Better Auth's schema but should be referred to as `workspace` in all user-facing code and variable names. See CONTEXT.md for domain naming conventions.
- Sign-in copy should emphasize speed ("Get started in seconds") rather than account management.
