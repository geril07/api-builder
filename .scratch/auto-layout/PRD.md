Status: done

# Auto-layout v2 — dagre-native LR layout with colocation

## Problem Statement

The current auto-layout uses a rigid three-column top-to-bottom layout with hardcoded X positions (resources at 150, schemas at 500, auth schemes at 850). Connected entities are separated by 350px gaps, making relationships hard to see. The column order (resources → schemas → auth schemes) doesn't tell a meaningful architectural story. Auth feels like an afterthought.

## Solution

A single-click "Auto-layout" action recomputes the positions of all canvas nodes using dagre with `rankdir: 'LR'`. Column order changes to **auth → resources → schemas** (left to right), which reads naturally as "who can access → what they access → what shape the data is". Dagre computes all positions — no hardcoded column X values. Connected entities share the same vertical row, achieving true visual colocation.

Auth visual edges flip direction (`authScheme → resource`) so all arrows flow left-to-right across the canvas. Schema edges remain `resource → schema`.

The action is available via a toolbar button and a context-menu entry on the empty canvas.

## User Stories

1. As a canvas user, I want to click an "Auto-layout" button in the toolbar, so that all nodes rearrange into a clean layout organised by architectural role.
2. As a canvas user, I want to right-click the empty canvas and select "Auto-layout" from the context menu, so that I don't have to reach the toolbar.
3. As a canvas user, I want Auth Schemes on the left, Resources in the centre, and Schemas on the right, so that the canvas reads left-to-right as "auth → resource → schema".
4. As a canvas user, I want a Schema or Auth Scheme referenced by a Resource's Endpoints to share the same vertical row as that Resource, so that connected entities are visually colocated.
5. As a canvas user, I want a Schema or Auth Scheme shared by multiple Resources to be positioned naturally between them by dagre, so that the layout reflects its shared nature.
6. As a canvas user, I want unused Schemas and Auth Schemes (not referenced by any Endpoint) to stay at the bottom of their type column sorted alphabetically, so that they remain visible and accessible.
7. As a canvas user, I want unconnected Resources (no Endpoints) to stay at the bottom of the Resources column sorted alphabetically, so that they remain part of the layout.
8. As a canvas user, I want visible edges on the canvas to flow authScheme → resource (amber, dotted) and resource → schema (blue/green), so that arrows match the left-to-right reading flow.
9. As a canvas user, I want to be able to manually drag nodes after auto-layout, so that I can fine-tune the result.
10. As a canvas user, I want all position changes persisted to the database immediately, so that the layout survives a page reload.

## Implementation Decisions

### Layout engine (pure function, existing module)

- **File**: `src/modules/api-design-editor/layout.ts` — rewrite the existing `computeAutoLayout` function.
- **Input**: unchanged — `LayoutInput { resources, schemas, authSchemes, endpoints }`.
- **Output**: unchanged — `LayoutOutput { resources, schemas, authSchemes }` each with `{ id, positionX, positionY }`.
- **Dagre config**: `rankdir: 'LR'` instead of `'TB'`. No hardcoded column X values.
- **Edge direction**: `authScheme → resource` for auth edges (flipped from v1). `resource → schema` stays.
- **Connected entities**: use dagre-computed positions (both X and Y) directly.
- **Unconnected entities**: placed below the last connected entity of the same type, sorted A-Z. Their X is the median X of connected entities of the same type, or a reasonable default if none exist.
- **Spacing**: `nodesep: 80`, `ranksep: 150`.
- No React, no DB, no client state — pure transformation.

### Visual edge direction flip

- **File**: `src/modules/api-design-editor/edges/compute-edges.ts`.
- Auth edges: source changes from `resourceId` to `schemeId`, target changes from `schemeId` to `resourceId`.
- Edge IDs change from `${resourceId}→${schemeId}:auth` to `${schemeId}→${resourceId}:auth`.
- Schema edges (requestBody, responseShape): unchanged — source remains `resourceId`, target remains `schemaId`.
- Edge styling (amber dotted for auth, blue solid for requestBody, green dashed for responseShape): unchanged.

### Canvas integration

- **No changes** to `canvas.tsx` or `mutations.ts` — the input/output shape of `computeAutoLayout` and `autoLayoutMutationOptions` is identical.

### Other layers (unchanged from v1)

- **Batch-position update**: existing `autoLayout` function in `src/modules/api-design/service.ts` — unchanged.
- **ORPC procedure**: existing `autoLayoutProc` — unchanged.
- **Client mutation**: existing `autoLayoutMutationOptions` — unchanged.
- **Triggers**: toolbar button (`<Grid3x3>`) and context-menu entry — unchanged.

## Testing Decisions

- **What makes a good test**: A test that exercises the pure layout function with known input and asserts the output positions match expected layout properties (type columns from dagre, vertical row sharing for connected entities, alphabetical fallback for unconnected). No tests for the DB service or ORPC — they follow existing patterns.
- **Module to test**: `src/modules/api-design-editor/layout.ts` — the pure layout engine.
- **What to test**:
  - Empty input returns empty output.
  - Only Resources: each placed in rank 0 (left column).
  - Only Schemas: each placed in rank 1 (middle column) — no auth column present.
  - Resources + Schemas with reference edges: Schema positioned in same row as its referencing Resource (similar Y).
  - Shared Schema: Schema positioned between two referencing Resources at a similar Y.
  - Unconnected entities: placed below connected entities, sorted alphabetically within their type.
  - Auth Schemes: placed in rank 0 (leftmost column) with dagre-computed X.
  - Mixed all-three-types with complex references.
  - Edge direction: auth edges go `authScheme → resource` (layout-internal edges — not tested via compute-edges, which is a separate module).
- **Prior art**: Existing `layout.test.ts` (333 lines, 15 tests) follows standard Vitest patterns — rewrite inline.

## Out of Scope

- Automatic triggering on page load or after entity creation.
- Saving/restoring user's preferred layout zones per type.
- Incremental layout (re-layout only new/changed nodes).
- Pagination or virtualisation for very large designs.
- Layout animation or transitions.
- Edge direction changes for schema edges (requestBody, responseShape remain resource→schema).

## Further Notes

- No new npm dependencies — dagre already installed.
- The auto-layout action is purely additive — no entity data is changed, only positions.
- Users can always manually re-drag nodes after auto-layout.
- The context menu entry and toolbar button use the existing `canvas.tsx` state (no new state added).
- ADR 0005 documents the edge-direction flip and LR-native decision for future readers.
