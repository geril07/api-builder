# ADR 0004: TanStack Query for API Design Persistence

## Status

Accepted

## Context

The API Design editor page currently persists changes via Server Actions + `router.refresh()`.

**Current flow:** User action → Server Action (DB write + `revalidatePath`) → `router.refresh()` → full server re-render → all resources + endpoints re-fetched → props re-serialized → Canvas re-renders.

This causes:

- Full DB re-fetch of all data on every mutation (O(n) per keystroke)
- `router.refresh()` fired 6+ times across the Canvas
- No optimistic updates — every edit waits on server round-trip
- `isLoading` state blocks all interactions during saves
- Potential state desync between ReactFlow internal state and rehydrated props
- No cache invalidation model to support future collaboration (v2)

## Decision

Replace the `router.refresh()`-based persistence with **TanStack Query** using the Server Component Prefetch pattern.

### Architecture

```
Server Component (page.tsx)
├── Auth guard + 404 (unchanged)
├── QueryClient.prefetchQuery(apiDesignQueryOptions)
└── <HydrationBoundary state={dehydrate(queryClient)}>
    └── CanvasEditor (client component)
        ├── useQuery(apiDesignQueryOptions) — reads from hydrated cache
        ├── useMutation(createResourceMutationOptions)
        ├── useMutation(updateResourceMutationOptions)
        ├── useMutation(deleteResourceMutationOptions)
        ├── useMutation(createEndpointMutationOptions)
        ├── useMutation(updateEndpointMutationOptions)
        └── useMutation(deleteEndpointMutationOptions)
```

### Key decisions

| #   | Decision                                                                          | Rationale                                                                           |
| --- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1   | Single query `['apiDesign', apiDesignId]`                                         | One invalidation refreshes everything. Simpler optimistic cache painting.           |
| 2   | Server component auth + prefetch + `HydrationBoundary`                            | No loading flash. Auth/404 stay server-side. Data hydrated on load.                 |
| 3   | Provider in `(authenticated)/layout.tsx`                                          | Query client only exists where queries are used.                                    |
| 4   | Query/mutation factories colocated at `[apiDesignId]/queries.ts` + `mutations.ts` | Tight to the feature. Single consumer.                                              |
| 5   | Per-mutation inline errors                                                        | Each form field knows which mutation failed.                                        |
| 6   | ReactFlow state owns positions, background mutation for persist                   | Drag is UI-only. Mutation fires on drag stop, no optimistic position cache.         |
| 7   | No debounce — `onBlur` pattern is sufficient                                      | TanStack Query serializes mutations. Blur creates natural pause.                    |
| 8   | Server actions accept typed objects instead of FormData                           | Cleaner API. Same object flows into `mutationFn` and `onMutate` for cache painting. |
| 9   | `queryOptions`/`mutationOptions` factories                                        | Follows TanStack Query pattern skill. Keys and invalidation are centralized.        |

### Mutations

Six mutation factories, one per server action:

- `createResourceMutationOptions`
- `updateResourceMutationOptions`
- `deleteResourceMutationOptions`
- `createEndpointMutationOptions`
- `updateEndpointMutationOptions`
- `deleteEndpointMutationOptions`

All follow the optimistic pattern: `onMutate` snapshots and paints cache → `onError` rolls back → `onSettled` invalidates.

### Read action

A new `getApiDesignDataAction(apiDesignId)` server action returns `{ resources, endpoints }`. Used as `queryFn` for prefetch and client fetch. Extracts the DB queries currently in `page.tsx`.

### Position handling

ReactFlow's `useNodesState` owns position. `onNodeDragStop` fires `updateResourceAction({ resourceId, positionX, positionY })` as a background mutation. On error, the node snaps back to its previous position from ReactFlow state. Query cache invalidates silently in background for consistency.

## Consequences

- **Positive**: Snappy UX — every edit feels instant via optimistic cache. No `router.refresh()` flicker.
- **Positive**: Cache model carries directly to v2 collaboration (add WebSocket → `invalidateQueries`).
- **Positive**: `queryClient.getQueryData()` enables cache reads without prop drilling.
- **Positive**: React Query DevTools available for debugging.
- **Neutral**: Adds ~14 KB gzipped bundle (TanStack Query).
- **Neutral**: Canvas becomes a client component (already is, no change).
- **Negative**: More code upfront — 6 mutation factories, 1 query factory, provider setup.
- **Negative**: Must ensure server-side and client-side data shapes match between read action and initial prefetch.
