import { describe, it, expect } from 'vitest'
import { computeEdges } from './compute-edges'
import type { ResourceEdgeData } from './compute-edges'

function baseEdge(id: string) {
  return {
    id,
    type: 'resourceEdge',
    style: { strokeWidth: 2 },
  }
}

const RESOURCES = [{ id: 'r1' }, { id: 'r2' }]
const SCHEMAS = [{ id: 's1' }, { id: 's2' }]
const AUTH_SCHEMES = [{ id: 'a1' }]

describe('computeEdges', () => {
  it('returns empty array for no endpoints', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [],
    })
    expect(result).toEqual([])
  })

  it('creates a request body edge from resource to schema', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [
        {
          resourceId: 'r1',
          method: 'POST',
          path: '/users',
          summary: 'Create user',
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
      ],
    })

    expect(result).toHaveLength(1)
    expect(result[0]!).toMatchObject({
      ...baseEdge('r1->s1:requestBody'),
      source: 'r1',
      target: 's1',
      style: {
        stroke: '#3b82f6',
        strokeWidth: 2,
      },
      data: {
        types: ['requestBody'],
        pathOffset: 0,
        endpoints: [{ method: 'POST', path: '/users', summary: 'Create user' }],
      },
    })
  })

  it('creates a response shape edge from resource to schema', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [
        {
          resourceId: 'r1',
          method: 'GET',
          path: '/users',
          summary: 'List users',
          requestBodySchemaId: null,
          responseShapeSchemaId: 's2',
          authSchemeIds: [],
        },
      ],
    })

    expect(result).toHaveLength(1)
    expect(result[0]!).toMatchObject({
      ...baseEdge('r1->s2:responseShape'),
      source: 'r1',
      target: 's2',
      style: { stroke: '#22c55e', strokeDasharray: '6 3' },
      data: { types: ['responseShape'] },
    })
  })

  it('creates an auth edge from auth scheme to resource', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [
        {
          resourceId: 'r1',
          method: 'GET',
          path: '/users',
          summary: null,
          requestBodySchemaId: null,
          responseShapeSchemaId: null,
          authSchemeIds: ['a1'],
        },
      ],
    })

    expect(result).toHaveLength(1)
    expect(result[0]!).toMatchObject({
      ...baseEdge('a1->r1:auth'),
      source: 'a1',
      target: 'r1',
      style: { stroke: '#f59e0b', strokeDasharray: '2 3' },
      data: { types: ['auth'] },
    })
  })

  it('deduplicates when multiple endpoints reference the same source-target-type', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [
        {
          resourceId: 'r1',
          method: 'POST',
          path: '/users',
          summary: null,
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
        {
          resourceId: 'r1',
          method: 'PUT',
          path: '/users/:id',
          summary: null,
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
      ],
    })

    expect(result).toHaveLength(1)
    const data = result[0]!.data as ResourceEdgeData
    expect(data.endpoints).toHaveLength(2)
    expect(data.endpoints).toEqual(
      expect.arrayContaining([
        { method: 'POST', path: '/users', summary: null },
        { method: 'PUT', path: '/users/:id', summary: null },
      ]),
    )
    expect(data.pathOffset).toBe(0)
  })

  it('creates parallel edges when same pair has different connection types', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [
        {
          resourceId: 'r1',
          method: 'POST',
          path: '/users',
          summary: null,
          requestBodySchemaId: 's1',
          responseShapeSchemaId: 's1',
          authSchemeIds: [],
        },
      ],
    })

    expect(result).toHaveLength(2)

    const reqBody = result.find((e) => e.id === 'r1->s1:requestBody')
    const resShape = result.find((e) => e.id === 'r1->s1:responseShape')

    expect(reqBody).toBeDefined()
    expect(resShape).toBeDefined()
    expect(reqBody!.data!.pathOffset).not.toBe(0)
    expect(resShape!.data!.pathOffset).not.toBe(0)
    expect(reqBody!.data!.pathOffset).not.toBe(resShape!.data!.pathOffset)
  })

  it('skips edges where target schema is not on the canvas', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [
        {
          resourceId: 'r1',
          method: 'POST',
          path: '/users',
          summary: null,
          requestBodySchemaId: 'nonexistent-schema',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
      ],
    })

    expect(result).toHaveLength(0)
  })

  it('skips edges where target auth scheme is not on the canvas', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [
        {
          resourceId: 'r1',
          method: 'GET',
          path: '/users',
          summary: null,
          requestBodySchemaId: null,
          responseShapeSchemaId: null,
          authSchemeIds: ['nonexistent-auth'],
        },
      ],
    })

    expect(result).toHaveLength(0)
  })

  it('creates edges for different resources to different targets', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [
        {
          resourceId: 'r1',
          method: 'POST',
          path: '/users',
          summary: null,
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
        {
          resourceId: 'r2',
          method: 'POST',
          path: '/orders',
          summary: null,
          requestBodySchemaId: 's2',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
      ],
    })

    expect(result).toHaveLength(2)
    expect(result.map((e) => e.id).sort()).toEqual([
      'r1->s1:requestBody',
      'r2->s2:requestBody',
    ])
  })

  it('includes endpoints data in the edge', () => {
    const result = computeEdges({
      resources: RESOURCES,
      schemas: SCHEMAS,
      authSchemes: AUTH_SCHEMES,
      endpoints: [
        {
          resourceId: 'r1',
          method: 'GET',
          path: '/users/:id',
          summary: 'Get user by ID',
          requestBodySchemaId: null,
          responseShapeSchemaId: 's1',
          authSchemeIds: [],
        },
      ],
    })

    expect(result[0]!.data!.endpoints).toEqual([
      { method: 'GET', path: '/users/:id', summary: 'Get user by ID' },
    ])
  })
})
