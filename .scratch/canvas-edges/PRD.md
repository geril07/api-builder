Status: done

# PRD: Canvas Edges / Connections

## Problem Statement

The API Design canvas shows Resources, Schemas, and Auth Schemes as disconnected cards. There is no visual indication of how they relate — which Schema is used as a request body or response shape by which Resource, or which Auth Scheme protects which Resource. API designers must open the sidebar or inspect Endpoints individually to understand the structure. This wastes time and obscures the API architecture.

## Solution

Render visual edges (connections) on the canvas between Resources and the Schemas/Auth Schemes they reference via Endpoints. Edges are read-only (derived from endpoint data, not user-drawn). Edge style encodes the connection type: solid blue for requestBody, dashed green for responseShape, dotted amber for auth. Hovering reveals which endpoint(s) created the edge.

## User Stories

1. As an API designer, I want to see which Schema a Resource uses as its request body at a glance, so that I understand the API data flow without opening the sidebar.
2. As an API designer, I want to see which Schema a Resource uses as its response shape at a glance, so that I understand what data is returned.
3. As an API designer, I want to see which Auth Scheme protects a Resource at a glance, so that I understand security boundaries.
4. As an API designer, I want edges to be styled differently per connection type (requestBody vs responseShape vs auth), so that I can distinguish them visually on a busy canvas.
5. As an API designer, I want to hover over an edge and see which endpoint(s) created it, so that I can trace the exact relationship.
6. As an API designer, I want edges to stay in sync when I add, update, or delete endpoint references in the sidebar, without manual intervention.
7. As an API designer, I want edges to follow the closest-path between node rectangles, so that the canvas looks clean and avoids unnecessary line crossings.
8. As an API designer, I want the auto-layout to continue respecting these connections, so that layout remains meaningful after edges are visible.

## Implementation Decisions

### Module: `edges/compute-edges.ts` (new)

Pure function with signature:

```ts
function computeEdges(input: {
  resources: { id: string }[]
  schemas: { id: string }[]
  authSchemes: { id: string }[]
  endpoints: {
    resourceId: string
    requestBodySchemaId: string | null
    responseShapeSchemaId: string | null
    authSchemeIds: string[]
  }[]
}): Edge[]
```

- Deduplicates: one edge per unique Resource→target pair
- Skips edges where the target node (Schema/AuthScheme) is not on the canvas
- Parallel edges when the same pair has multiple connection types (e.g., both requestBody and responseShape)
- Returns React Flow `Edge` objects with `id`, `source`, `target`, `type: 'resourceEdge'`, `style`, `markerEnd`, and `data: { types, endpoints }`

### Module: `edges/resource-edge.tsx` (new)

Custom React Flow edge component (`resourceEdge`):

- Computes closest-point path between the two node rectangles (no Handle components needed)
- Renders SVG bezier curve with stroke style and arrow marker from `data`
- On hover: displays a tooltip showing `{type}: {method} {path}` for each contributing endpoint
- Handles `animated` prop for future use (e.g., auto-layout transitions)

### Module: `edges/index.ts` (new)

- Re-exports `edgeTypes: EdgeTypes` registry object containing `{ resourceEdge: ResourceEdge }`
- Re-exports `computeEdges` from `compute-edges.ts`

### Modification: `canvas.tsx`

- Import `useEdgesState` from `@xyflow/react` (already available, unused)
- Import `edgeTypes` from `edges/index.ts`
- Derive initial edges via `useMemo` using `computeEdges(endpoints, resources, schemas, authSchemes)`
- Pass `edges`, `edgeTypes`, and `onEdgesChange` to `<ReactFlow>`
- Sync edges on data changes (same pattern as node sync `useEffect`)
- No `onConnect` handler (read-only edges)

### Edge data model

Each computed edge carries in `data`:

```ts
type ResourceEdgeData = {
  types: Array<'requestBody' | 'responseShape' | 'auth'>
  endpoints: Array<{
    method: string
    path: string
    summary: string | null
  }>
}
```

Used for hover tooltip content.

### Edge style map

| Connection type | Stroke                        | Marker                          |
| --------------- | ----------------------------- | ------------------------------- |
| requestBody     | `#3b82f6` (blue-500), solid   | `MarkerType.ArrowClosed`, blue  |
| responseShape   | `#22c55e` (green-500), dashed | `MarkerType.ArrowClosed`, green |
| auth            | `#f59e0b` (amber-500), dotted | `MarkerType.ArrowClosed`, amber |

### No changes to node components

Because edges compute their own closest-path routing from node bounding rects, no `<Handle>` components are added to `resource-node.tsx`, `schema-node.tsx`, or `auth-scheme-node.tsx`. This keeps the node code clean and leaves open the option to add interactive handles later.

## Testing Decisions

- Tests validate external behavior (edges output shape, not rendering)
- Good test: call `computeEdges` with a known input, assert correct `Edge[]`
- Only `compute-edges.ts` is tested — the pure function with clear contract
- `resource-edge.tsx` is SVG/tooltip rendering — low value to assert, not tested
- Edge sync reactivity in `canvas.tsx` is covered by existing integration patterns (follows same pattern as node sync)

### Test coverage for `compute-edges.ts`

1. Empty endpoints → empty edges
2. Single endpoint with requestBody → one solid blue edge, correct source/target
3. Deduplication: three endpoints referencing same Schema as requestBody → one edge
4. Parallel types: same pair has both requestBody and responseShape → two edges (different styles)
5. Missing target: endpoint references a Schema not on the canvas → edge skipped
6. Auth scheme: endpoint references authScheme → dotted amber edge
7. Multiple connection types on same endpoint → edges for each unique Resource→target pair
8. Mixed: different endpoints on same Resource, different targets → one edge per unique pair

## Out of Scope

- User-drawn edges (dragging between handles to create connections)
- Edge selection, deletion, or editing from the canvas
- Animated edges (reserved for future use)
- Edge labels as text on the canvas (tooltip-only)
- Custom node handles
- Cross-API Design edges (each design is independent)

## Further Notes

- Existing auto-layout in `layout.ts` already models these edges for dagre — no changes needed there
- Existing `EndpointDto` already carries `requestBodySchemaId`, `responseShapeSchemaId`, and `authSchemeIds` — no DB or type changes needed
- The edge feature is purely additive: no existing behavior changes
- Future consideration: if edges become interactive, handles and `onConnect` handler would need adding then
