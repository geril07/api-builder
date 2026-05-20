import { describe, expect, it } from 'vitest'
import { buildFlatUsage, buildResourcesWithEndpoints } from './data'
import { getFlatCreatePosition } from './create-position'
import type { ApiDesignSidebarData } from '../queries'

const data = {
  resources: [{ id: 'r1', name: 'Users' }],
  endpoints: [
    {
      id: 'e2',
      resourceId: 'r1',
      method: 'POST',
      path: '/users',
      sortOrder: 2,
      requestBodySchemaId: 's1',
      responseShapeSchemaId: null,
      authSchemeIds: ['a1'],
    },
    {
      id: 'e1',
      resourceId: 'r1',
      method: 'GET',
      path: '/users',
      sortOrder: 1,
      requestBodySchemaId: null,
      responseShapeSchemaId: 's1',
      authSchemeIds: [],
    },
  ],
  schemas: [{ id: 's1', name: 'User' }],
  authSchemes: [{ id: 'a1', name: 'Bearer' }],
} as ApiDesignSidebarData

describe('flat data helpers', () => {
  it('sorts endpoints inside resources', () => {
    const [resource] = buildResourcesWithEndpoints(data)

    expect(resource?.endpoints.map((endpoint) => endpoint.id)).toEqual([
      'e1',
      'e2',
    ])
  })

  it('derives schema and auth usage from endpoints', () => {
    const usage = buildFlatUsage(data)

    expect(usage.schemaUsage.get('s1')?.map((ref) => ref.kind)).toEqual([
      'request',
      'response',
    ])
    expect(usage.authSchemeUsage.get('a1')?.[0]?.label).toBe(
      'POST /users in Users',
    )
  })
})

describe('flat create positions', () => {
  it('returns stable numeric positions for a type and count', () => {
    expect(getFlatCreatePosition('schema', [])).toEqual({
      positionX: 520,
      positionY: 120,
    })
    expect(
      getFlatCreatePosition('schema', [
        { positionX: 520, positionY: 120 },
        { positionX: 520, positionY: 240 },
      ]),
    ).toEqual({ positionX: 520, positionY: 360 })
  })
})
