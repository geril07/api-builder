import { describe, expect, it } from 'vitest'
import { filterAuthSchemes, filterResources, filterSchemas } from './search'

describe('filterResources', () => {
  it('filters resources by name (case-insensitive)', () => {
    const items = [
      {
        resource: { name: 'Users', description: null },
        endpoints: [],
      },
      {
        resource: { name: 'Products', description: null },
        endpoints: [],
      },
    ]

    expect(filterResources(items, 'users')).toEqual([items[0]])
    expect(filterResources(items, 'PRODUCTS')).toEqual([items[1]])
    expect(filterResources(items, 'product')).toEqual([items[1]])
  })

  it('filters resources by endpoint method or path', () => {
    const items = [
      {
        resource: { name: 'Users', description: null },
        endpoints: [{ method: 'GET', path: '/users' }],
      },
      {
        resource: { name: 'Products', description: null },
        endpoints: [{ method: 'POST', path: '/products' }],
      },
    ]

    expect(filterResources(items, 'get')).toEqual([items[0]])
    expect(filterResources(items, '/products')).toEqual([items[1]])
    expect(filterResources(items, 'post')).toEqual([items[1]])
  })

  it('returns all items when query is empty', () => {
    const items = [
      {
        resource: { name: 'Users', description: null },
        endpoints: [],
      },
      {
        resource: { name: 'Products', description: null },
        endpoints: [],
      },
    ]

    expect(filterResources(items, '')).toEqual(items)
    expect(filterResources(items, '   ')).toEqual(items)
  })

  it('returns empty array when no match', () => {
    const items = [
      {
        resource: { name: 'Users', description: null },
        endpoints: [],
      },
    ]

    expect(filterResources(items, 'nonexistent')).toEqual([])
  })

  it('filters resources by description (case-insensitive)', () => {
    const items = [
      {
        resource: { name: 'Users', description: 'Manage user accounts' },
        endpoints: [],
      },
      {
        resource: { name: 'Products', description: null },
        endpoints: [],
      },
    ]

    expect(filterResources(items, 'accounts')).toEqual([items[0]])
    expect(filterResources(items, 'ACCOUNTS')).toEqual([items[0]])
  })
})

describe('filterSchemas', () => {
  it('filters schemas by name (case-insensitive)', () => {
    const items = [{ name: 'UserSchema' }, { name: 'ProductSchema' }]

    expect(filterSchemas(items, 'user')).toEqual([items[0]])
    expect(filterSchemas(items, 'PRODUCT')).toEqual([items[1]])
  })

  it('returns all items when query is empty', () => {
    const items = [{ name: 'UserSchema' }, { name: 'ProductSchema' }]
    expect(filterSchemas(items, '')).toEqual(items)
  })

  it('returns empty array when no match', () => {
    expect(filterSchemas([{ name: 'UserSchema' }], 'nope')).toEqual([])
  })
})

describe('filterAuthSchemes', () => {
  it('filters auth schemes by name (case-insensitive)', () => {
    const items = [
      { name: 'Bearer Token', type: 'bearer' },
      { name: 'API Key', type: 'apiKey' },
    ]

    expect(filterAuthSchemes(items, 'bearer')).toEqual([items[0]])
    expect(filterAuthSchemes(items, 'api key')).toEqual([items[1]])
  })

  it('filters auth schemes by type (case-insensitive)', () => {
    const items = [
      { name: 'Main Auth', type: 'bearer' },
      { name: 'API Key', type: 'apiKey' },
    ]

    expect(filterAuthSchemes(items, 'apikey')).toEqual([items[1]])
    expect(filterAuthSchemes(items, 'BEARER')).toEqual([items[0]])
  })

  it('returns all items when query is empty', () => {
    expect(
      filterAuthSchemes([{ name: 'Bearer Token', type: 'bearer' }], ''),
    ).toEqual([{ name: 'Bearer Token', type: 'bearer' }])
  })

  it('returns empty array when no match', () => {
    expect(
      filterAuthSchemes([{ name: 'Bearer Token', type: 'bearer' }], 'nope'),
    ).toEqual([])
  })
})
