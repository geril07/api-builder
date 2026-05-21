Status: ready-for-agent

# 01 - Search/filter in flat mode entity lists

## What to build

Add a search input to the Resources, Schemas, and Auth-Schemes tabs in the flat editor (`src/modules/api-design-editor/flat/flat-editor.tsx`) that filters entities client-side by name (and optionally description/type).

## Motivation

When an API design has 50+ resources or schemas, users must scroll the entire list to find what they need. No search or filter exists in flat mode.

## Acceptance criteria

- [ ] A search `<Input>` with a search icon appears at the top of each tab's scrollable list area
- [ ] Typing in the input filters the list in real-time (no debounce needed, client-side only)
- [ ] Filter is case-insensitive, matches `name` field for all entity types; for resources also match `description`
- [ ] Search state is per-tab and resets when tab changes
- [ ] When filter yields zero results, show a "No results" message (not the empty-state with create button)
- [ ] Works in Resources tab (filters both resources and their visible endpoints? — decide: filter resources, endpoints shown only if parent resource matches)
- [ ] Works in Schemas tab (filters schemas by name)
- [ ] Works in Auth-Schemes tab (filters by name and type)

## Open questions

- Should search in Resources tab also filter endpoints? Probably yes — resource visible only if name matches OR any endpoint path/method matches.
- Debounce vs immediate? Immediate is fine for client-side filter on small-to-medium datasets.

## Not in scope

- Server-side search or pagination
- Filter by usage (e.g. "schemas used by endpoints")
- Canvas mode search
