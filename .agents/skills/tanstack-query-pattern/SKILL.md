---
name: tanstack-query-pattern
description: Provides reusable patterns for TanStack Query factories, keys, disabled queries, and invalidation. Use when writing or refactoring TanStack Query queries, mutations, query keys, disabled queries, and invalidation logic.
---

# TanStack Query Pattern

Use `queryOptions` and `mutationOptions` factories as the source of truth for TanStack Query configuration. Prefer the smallest correct query key shape, and add disabled behavior, key normalization, or broad invalidation scopes only when the query actually needs them.

## Quick start

```ts
import { queryOptions } from "@tanstack/react-query";

export const listTodosQueryOptions = (arg: { userId: number }) =>
  queryOptions({
    queryKey: ["listTodos", arg] as const,
    queryFn: () => fetchTodos(arg),
  });
```

## Workflows

1. Start with a `queryOptions` or `mutationOptions` factory.
2. Use a single object arg when params exist.
3. Use `queryKey: ["name", arg]` as the default key shape.
4. Add `skipToken` only when disabled behavior is required.
5. Add `{ ...arg }` only when empty/missing args should normalize to the same object key shape.
6. Add scoped keys only when broad invalidation or cache operations need prefix matching.
7. Extract invalidation utilities only after repeated invalidation logic appears.

## Advanced features

See [REFERENCE.md](REFERENCE.md) for detailed coverage of query factories, disabled queries, key normalization, broad invalidation, and mutation factories.

## Red Flags

- Hard-coded query keys duplicated across queries and mutations
- Passing `undefined` into a query that should not be disabled
- Large mutation `onSuccess` blocks with repeated invalidation details
