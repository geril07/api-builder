# TanStack Query Implementation Plan

> **Status: Complete** — All five phases implemented. See
> [ADR 0004](adr/0004-tanstack-query-persistence.md) for rationale.

## Phase 1: Foundation (files: 4 new, 1 modified)

### 1.1 Install dependency

```bash
npm install @tanstack/react-query
```

### 1.2 Create `src/app/(authenticated)/query-provider.tsx`

Client component wrapping `QueryClientProvider` with the Next.js singleton pattern.

- Server: new `QueryClient` per request with `staleTime: 60_000`
- Browser: reuse singleton to avoid Suspense discard
- Expose helper `getQueryClient()` for server component prefetch

### 1.3 Wire provider into `(authenticated)/layout.tsx`

Wrap `{children}` in `<QueryProvider>`. Kept in authenticated scope only.

### 1.4 Create `src/app/(authenticated)/api-designs/[apiDesignId]/queries.ts`

Single query factory:

```ts
export const apiDesignQueryOptions = (apiDesignId: string) =>
  queryOptions({
    queryKey: ['apiDesign', apiDesignId] as const,
    queryFn: () => getApiDesignDataAction(apiDesignId),
  })
```

## Phase 2: Server Actions Refactor (files: 3 modified)

### 2.1 Add read action to `endpoint-actions.ts`

New `getApiDesignDataAction(apiDesignId)` — extracts DB queries from `page.tsx`.
Returns: `ActionResult<{ resources: Resource[], endpoints: Endpoint[] }>`

### 2.2 Convert `resource-actions.ts` to typed objects

Replace FormData with typed input types:

```ts
// Before
export async function updateResourceAction(formData: FormData)
// After
export async function updateResourceAction(input: {
  resourceId: string
  name?: string
  description?: string | null
  positionX?: number
  positionY?: number
})
```

Same for create and delete actions. Drop FormData parsing.

### 2.3 Convert `endpoint-actions.ts` to typed objects

Same approach. Update takes `Partial<{ method, path, summary, requestBody, responseShape, authRequirement }>`.

## Phase 3: Mutation Factories (files: 1 new)

### 3.1 Create `src/app/(authenticated)/api-designs/[apiDesignId]/mutations.ts`

Six `mutationOptions` factories, each following this structure:

```ts
export const updateResourceMutationOptions = () =>
  mutationOptions({
    mutationFn: (vars: UpdateResourceVars) => updateResourceAction(vars),
    onMutate: async (vars) => {
      // Cancel in-flight query
      await queryClient.cancelQueries({ queryKey: apiDesignQueryOptions(vars.apiDesignId).queryKey })
      // Snapshot
      const prev = queryClient.getQueryData(apiDesignQueryOptions(vars.apiDesignId).queryKey)
      // Optimistic update
      queryClient.setQueryData(apiDesignQueryOptions(vars.apiDesignId).queryKey, old => ...)
      return { prev }
    },
    onError: (error, vars, ctx) => {
      // Rollback
      queryClient.setQueryData(apiDesignQueryOptions(vars.apiDesignId).queryKey, ctx?.prev)
    },
    onSettled: (_data, _error, vars) => {
      // Invalidate for server truth
      queryClient.invalidateQueries({ queryKey: apiDesignQueryOptions(vars.apiDesignId).queryKey })
    },
  })
```

Optimistic cache operations per mutation:

- `createResource`: append to `resources[]` with optimistic id
- `updateResource`: map over `resources[]`, patch matching id
- `deleteResource`: filter `resources[]` + cascade filter `endpoints[]`
- `createEndpoint`: append to `endpoints[]` under matching `resourceId`
- `updateEndpoint`: map over `endpoints[]`, patch matching id
- `deleteEndpoint`: filter `endpoints[]`

## Phase 4: Page & Canvas Refactor (files: 3 modified)

### 4.1 Refactor `page.tsx`

- Keep auth guard
- Add `new QueryClient()` + `prefetchQuery(apiDesignQueryOptions(apiDesignId))`
- Pass `apiDesignId` to a new `CanvasEditor` wrapper
- Wrap in `<HydrationBoundary>`

### 4.2 Refactor `canvas.tsx` → become `useApiDesign` hook consumer

- Remove `resources`, `endpoints`, all action props
- Call `useQuery(apiDesignQueryOptions(apiDesignId))` for data
- Call `useMutation(...)` for each of the 6 mutations
- Pass typed callbacks down to SidebarPanel and ResourceNode
- Remove `router.refresh()` calls (8 places)
- Remove manual `setIsLoading` for saves — mutations track `isPending` per mutation
- Replace single `error` state with per-mutation `mutation.error`
- Keep ReactFlow position handling unchanged (Q8 — positions in ReactFlow state)

### 4.3 Refactor `sidebar-panel.tsx`

- Accept per-mutation error states as props
- Show inline error below the field that originates the mutation
- Remove `isLoading` prop — use `isPending` per mutation button instead

## Phase 5: Child Components (files: 2 modified)

### 5.1 `resource-node.tsx`

- Callbacks swap to typed mutation calls from Canvas
- Remove inline save logic in EndpointRow (already well-factored)
- No structural change needed — just type signature updates

### 5.2 `ai-panel.tsx`

- Replace `router.refresh()` with `queryClient.invalidateQueries()` on accept
- Import `useQueryClient` from TanStack Query
- Use `apiDesignQueryOptions` key for invalidation

## Files changed summary

| File                                 | Change                               |
| ------------------------------------ | ------------------------------------ |
| `package.json`                       | Add `@tanstack/react-query`          |
| `(authenticated)/layout.tsx`         | Wrap with QueryProvider              |
| `(authenticated)/query-provider.tsx` | **New** — Provider component         |
| `[apiDesignId]/queries.ts`           | **New** — Query factory              |
| `[apiDesignId]/mutations.ts`         | **New** — 6 mutation factories       |
| `[apiDesignId]/endpoint-actions.ts`  | Typed objects + add read action      |
| `[apiDesignId]/resource-actions.ts`  | Typed objects                        |
| `[apiDesignId]/page.tsx`             | Prefetch + HydrationBoundary         |
| `[apiDesignId]/canvas.tsx`           | Hooks-based, remove router.refresh() |
| `[apiDesignId]/sidebar-panel.tsx`    | Per-mutation errors                  |
| `[apiDesignId]/resource-node.tsx`    | Type signature updates               |
| `[apiDesignId]/ai-panel.tsx`         | Invalidate cache instead of refresh  |
