# Refactoring Plan

> Last updated: 2026-05-13

## Phase 1: Configuration fixes ✅

- [x] **.gitignore**: Add `.env` and `.env.*` patterns
- [x] **env.ts**: Zod validation, no hardcoded defaults, production env check
- [x] **drizzle.config.ts**: Uses `process.env.DATABASE_URL`
- [x] **next.config.mjs**: `poweredByHeader: false`, CSP headers, `images.remotePatterns` for OAuth avatars
- [x] **tsconfig.json**: ES2022 target, `noUncheckedIndexedAccess`, `forceConsistentCasingInFileNames`
- [x] **package.json**: Fixed `format`/`lint` scripts, added `lint:fix`, `format:check`, `db:push`, `clean`, `engines` field
- [x] **.prettierrc**: `tailwindStylesheet` path → `src/app/globals.css`

## Phase 2: Auth refactor ✅

- [x] `src/modules/auth/guard.ts` — `requireAuth()` returning `{ ok, session, workspaceId } | { ok: false }`
- [x] `src/modules/auth/workspace.ts` — workspace resolution
- [x] `import "server-only"` guards on auth server and db client
- [x] All imports updated

## Phase 3: Database fixes ✅

- [x] Performance indexes on all relevant columns
- [x] Type changes (`organizations.metadata` → jsonb, `endpoints.requestBody/responseShape` → jsonb)
- [x] CHECK constraints on `endpoints.method`, `members.role`, `invitations`
- [x] `updatedAt` on all tables
- [x] All ID columns use `uuid` type
- [x] Drizzle `relations()` for `sessions.activeOrganizationId`, `invitations.inviterId`
- [x] N+1 INSERT loop fixed — bulk insert in `acceptAiSuggestionAction`
- [x] `acceptAiSuggestionAction` wrapped in `db.transaction()`
- [x] Zod runtime validation in `acceptAiSuggestionAction`
- [x] Extra round-trip query fixed — `updateEndpointAction` and `deleteEndpointAction` use subquery-based ownership checks in single query

## Phase 4: Server actions cleanup ✅

- [x] All actions use `requireAuth()` guard
- [x] Dashboard actions return structured `ActionResult` (`createApiDesignAction` returns `{ id }` for client-side navigation)
- [x] Shared `ActionResult` type at `@/shared/actions/types`
- [x] Catch blocks log actual errors (`console.error`)
- [x] Input validation: name length, UUID format, empty checks
- [x] Editor page auth failure → `redirect("/sign-in")` instead of `notFound()`

## Phase 5: Shared components ✅

- [x] Dialog component (`@base-ui/react/dialog` wrapper) — no native `<dialog>` tags remain
- [x] `Alert` component extracted to `shared/ui/alert.tsx`
- [x] `MethodBadge` extracted + `METHOD_COLORS` → `shared/constants/http-methods.ts`
- [x] `Field` component extracted to `shared/ui/field.tsx`
- [x] `"use client"` on all shared UI components
- [x] Sign-in form a11y: `htmlFor`/`id`, `role="alert"` on error

## Phase 6: Canvas refactor ✅

- [x] `React.memo` on `ResourceNode`
- [x] `FormData` callbacks replaced with typed objects
- [x] `useMemo` for initial node state, `useEffect` sync for external changes
- [x] `resource-node.tsx` extracted
- [x] `MethodBadge` moved to shared
- [x] Loading states via mutation `isPending`

## Phase 7: Error/loading boundaries ✅

- [x] `error.tsx` at `/api-designs/[apiDesignId]/`, `/sign-in/`, `/`, `/dashboard/`
- [x] `loading.tsx` at `/api-designs/[apiDesignId]/`, `/sign-in/`, `/dashboard/`

## Phase 8: Accessibility ✅

- [x] `aria-haspopup` + `aria-expanded` handled by `@base-ui/react/dialog` primitives
- [x] `aria-label` on all interactive elements without visible text
- [x] Accessible labels on interactive elements
