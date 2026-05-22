# Use Client-Only Editor URL State

Status: done
Type: AFK

## Parent

.scratch/two-editor-modes/PRD.md

## What to build

Make API Design editor mode and Flat Mode tab changes update the URL without triggering a Next.js App Router navigation or re-running the page Server Component.

The selected Editor Mode and Flat Mode tab should remain persistent in query params for refreshes and shared links, but switching between them should feel instant and avoid the current server request delay.

Use client-only URL state for these editor UI params because the page Server Component does not need `mode` or `tab` to render server data.

## Acceptance criteria

- [ ] Switching between Canvas Mode and Flat Mode updates the `mode` query param without triggering a server request for the current page.
- [ ] Switching Flat Mode tabs updates the `tab` query param without triggering a server request for the current page.
- [ ] Existing unrelated query params are preserved when `mode` or `tab` changes.
- [ ] Refreshing a URL with `mode=flat` opens Flat Mode.
- [ ] Refreshing a URL with `tab=schemas` or `tab=auth-schemes` opens the matching Flat Mode tab when Flat Mode is active.
- [ ] Invalid or missing `mode` and `tab` params continue to fall back to the existing defaults.
- [ ] Browser history behavior is intentional: use replace-style updates unless product behavior explicitly requires back/forward entries for tab or mode changes.
- [ ] `npm run format`, `npm run typecheck`, `npm run lint`, and `npm run test` pass when run separately.

## Blocked by

None - can start immediately
