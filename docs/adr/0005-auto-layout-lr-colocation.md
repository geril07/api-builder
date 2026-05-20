# ADR 0005: Auto-layout — dagre-native LR layout with flipped edge direction

## Status

Accepted

## Context

The initial auto-layout (v1) used dagre with `rankdir: 'TB'` and hardcoded column X positions (resources at 150, schemas at 500, auth schemes at 850). Connected entities were separated by 350px gaps, making dependency relationships hard to see at a glance. The column order (resources → schemas → auth schemes) didn't reflect the architectural story — auth felt like an afterthought.

The layout also drew edges `resource → authScheme` in the dagre graph, which produced a right-to-left visual flow on the canvas after placement (resource in the middle column, auth on the right, edge pointing from resource to auth).

## Decision

Replace with dagre-native `rankdir: 'LR'` layout. Three key changes:

### 1. Layout direction

- `rankdir: 'LR'` — auth in rank 0 (left), resources in rank 1 (middle), schemas in rank 2 (right).
- No hardcoded column X values — dagre computes both X and Y positions.
- Connected entities share the same vertical row (similar Y), achieving visual colocation.
- Unconnected entities sit at the bottom of their type column, sorted A-Z.

### 2. Edge direction flip for auth

Both layout-internal edges and canvas visual edges change:

| Edge type | V1 direction          | V2 direction                  |
| --------- | --------------------- | ----------------------------- |
| Auth      | resource → authScheme | authScheme → resource         |
| Schema    | resource → schema     | resource → schema (unchanged) |

This ensures all arrows flow left-to-right across the canvas: "Auth guards Resource → Resource uses Schema".

### 3. Spacing

- `nodesep: 80` (vertical gap within a rank)
- `ranksep: 150` (horizontal gap between ranks)
- Default dagre centering — smaller columns are vertically centered against larger ones.

## Consequences

**Positive:**

- Connected entities are visually colocated (same row) — true proximity instead of 350px gaps.
- Left-to-right reading flow (auth → resource → schema) matches the architectural story.
- No hardcoded X positions — layout adapts naturally to the data.

**Negative:**

- Auth edge IDs change from `${resourceId}→${schemeId}:auth` to `${schemeId}→${resourceId}:auth` — existing references need updating.
- `compute-edges.ts` needs auth source/target swap.

**Neutral:**

- Layout module (`layout.ts`) rewritten; tests rewritten.
- No DB schema, API contract, or mutation layer changes.
- Trigger, persistence, and canvas integration unchanged.
