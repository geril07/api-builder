## Codebase Structure

```text
src/
  app/       Next.js routes, layouts, route handlers
  modules/   domain or features logic
  shared/    Generic reusable infrastructure, UI primitives, utilities
```

## Agent instructions

**Always read and follow codebase-guidelines**

**Use npm as a package manager**

**Before marking app-code changes as completed, run:**

- npm run format
- npm run typecheck
- npm run lint
- npm run test

**Make sure you are running these scripts separately because concat(&&) can be interruped if something will return errors**

## Agent skills

### Issue tracker

Local markdown — issues live as files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical role strings: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
