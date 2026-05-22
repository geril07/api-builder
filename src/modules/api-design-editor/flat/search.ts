function matchesQuery(value: string | null, q: string): boolean {
  return value != null && value.toLowerCase().includes(q)
}

function filterByQuery<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  fields: (keyof T)[],
): T[] {
  if (!query.trim()) return items
  const q = query.toLowerCase()
  return items.filter((item) =>
    fields.some((field) => matchesQuery(item[field] as string | null, q)),
  )
}

export function filterResources<
  T extends {
    resource: { name: string; description: string | null }
    endpoints: { method: string; path: string }[]
  },
>(items: T[], query: string): T[] {
  if (!query.trim()) return items
  const q = query.toLowerCase()
  return items.filter(
    (item) =>
      matchesQuery(item.resource.name, q) ||
      matchesQuery(item.resource.description, q) ||
      item.endpoints.some(
        (ep) => matchesQuery(ep.method, q) || matchesQuery(ep.path, q),
      ),
  )
}

export function filterSchemas<T extends { name: string }>(
  items: T[],
  query: string,
): T[] {
  return filterByQuery(items, query, ['name'])
}

export function filterAuthSchemes<T extends { name: string; type: string }>(
  items: T[],
  query: string,
): T[] {
  return filterByQuery(items, query, ['name', 'type'])
}
