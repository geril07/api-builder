import { describe, it, expect } from 'vitest'
import { computeAutoLayout, type LayoutInput } from './layout'

const NODE_HEIGHT = 80

function emptyInput(): LayoutInput {
  return { resources: [], schemas: [], authSchemes: [], endpoints: [] }
}

describe('computeAutoLayout', () => {
  it('returns empty output for empty input', () => {
    const result = computeAutoLayout(emptyInput())
    expect(result.resources).toEqual([])
    expect(result.schemas).toEqual([])
    expect(result.authSchemes).toEqual([])
  })

  it('places only-resources with vertical spacing and same X', () => {
    const result = computeAutoLayout({
      resources: [
        { id: 'r1', name: 'Users' },
        { id: 'r2', name: 'Orders' },
      ],
      schemas: [],
      authSchemes: [],
      endpoints: [],
    })

    expect(result.resources).toHaveLength(2)
    expect(result.resources[0]!.positionX).toBe(result.resources[1]!.positionX)
    expect(result.resources[0]!.positionX).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(result.resources[0]!.positionX)).toBe(true)
    expect(
      result.resources[1]!.positionY - result.resources[0]!.positionY,
    ).toBeGreaterThanOrEqual(NODE_HEIGHT)
  })

  it('places only-schemas with vertical spacing and same X', () => {
    const result = computeAutoLayout({
      resources: [],
      schemas: [
        { id: 's1', name: 'User' },
        { id: 's2', name: 'Order' },
      ],
      authSchemes: [],
      endpoints: [],
    })

    expect(result.schemas).toHaveLength(2)
    expect(result.schemas[0]!.positionX).toBe(result.schemas[1]!.positionX)
    expect(result.schemas[0]!.positionX).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(result.schemas[0]!.positionX)).toBe(true)
    expect(
      result.schemas[1]!.positionY - result.schemas[0]!.positionY,
    ).toBeGreaterThanOrEqual(NODE_HEIGHT)
  })

  it('places only-auth-schemes with vertical spacing and same X', () => {
    const result = computeAutoLayout({
      resources: [],
      schemas: [],
      authSchemes: [
        { id: 'a1', name: 'Bearer' },
        { id: 'a2', name: 'APIKey' },
      ],
      endpoints: [],
    })

    expect(result.authSchemes).toHaveLength(2)
    expect(result.authSchemes[0]!.positionX).toBe(
      result.authSchemes[1]!.positionX,
    )
    expect(result.authSchemes[0]!.positionX).toBeGreaterThanOrEqual(0)
    expect(Number.isInteger(result.authSchemes[0]!.positionX)).toBe(true)
    expect(
      result.authSchemes[1]!.positionY - result.authSchemes[0]!.positionY,
    ).toBeGreaterThanOrEqual(NODE_HEIGHT)
  })

  it('colocates referenced schema near its resource', () => {
    const result = computeAutoLayout({
      resources: [{ id: 'r1', name: 'Users' }],
      schemas: [{ id: 's1', name: 'User' }],
      authSchemes: [],
      endpoints: [
        {
          resourceId: 'r1',
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
      ],
    })

    const rY = result.resources[0]!.positionY
    const sY = result.schemas[0]!.positionY
    expect(Math.abs(rY - sY)).toBeLessThan(400)
  })

  it('handles multiple resources sharing one schema', () => {
    const result = computeAutoLayout({
      resources: [
        { id: 'r1', name: 'Users' },
        { id: 'r2', name: 'Auth' },
      ],
      schemas: [{ id: 's1', name: 'User' }],
      authSchemes: [],
      endpoints: [
        {
          resourceId: 'r1',
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
        {
          resourceId: 'r2',
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
      ],
    })

    expect(result.resources).toHaveLength(2)
    expect(result.schemas).toHaveLength(1)
    const sY = result.schemas[0]!.positionY
    for (const r of result.resources) {
      expect(Math.abs(r.positionY - sY)).toBeLessThan(400)
    }
  })

  it('places unconnected entities below connected ones sorted A-Z', () => {
    const result = computeAutoLayout({
      resources: [
        { id: 'r1', name: 'Users' },
        { id: 'r2', name: 'Alpha' },
        { id: 'r3', name: 'Zebra' },
      ],
      schemas: [{ id: 's1', name: 'User' }],
      authSchemes: [],
      endpoints: [
        {
          resourceId: 'r1',
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
      ],
    })

    const rConnected = result.resources.find((r) => r.id === 'r1')!
    const rAlpha = result.resources.find((r) => r.id === 'r2')!
    const rZebra = result.resources.find((r) => r.id === 'r3')!

    expect(rAlpha.positionY).toBeGreaterThan(rConnected.positionY + NODE_HEIGHT)
    expect(rZebra.positionY).toBeGreaterThan(rConnected.positionY + NODE_HEIGHT)
    expect(rAlpha.positionY).toBeLessThan(rZebra.positionY)
  })

  it('gives unique Y positions within each type for unconnected entities', () => {
    const result = computeAutoLayout({
      resources: [
        { id: 'r1', name: 'Alpha' },
        { id: 'r2', name: 'Beta' },
      ],
      schemas: [
        { id: 's1', name: 'First' },
        { id: 's2', name: 'Second' },
      ],
      authSchemes: [{ id: 'a1', name: 'OnlyAuth' }],
      endpoints: [],
    })

    const uniqueYs = {
      resources: new Set(result.resources.map((r) => r.positionY)),
      schemas: new Set(result.schemas.map((s) => s.positionY)),
      authSchemes: new Set(result.authSchemes.map((a) => a.positionY)),
    }

    expect(uniqueYs.resources.size).toBe(2)
    expect(uniqueYs.schemas.size).toBe(2)
    expect(uniqueYs.authSchemes.size).toBe(1)
  })

  it('places auth left of resources when connected', () => {
    const result = computeAutoLayout({
      resources: [{ id: 'r1', name: 'Users' }],
      schemas: [],
      authSchemes: [{ id: 'a1', name: 'Bearer' }],
      endpoints: [
        {
          resourceId: 'r1',
          requestBodySchemaId: null,
          responseShapeSchemaId: null,
          authSchemeIds: ['a1'],
        },
      ],
    })

    expect(result.authSchemes[0]!.positionX).toBeLessThan(
      result.resources[0]!.positionX,
    )
  })

  it('handles response shape references', () => {
    const result = computeAutoLayout({
      resources: [{ id: 'r1', name: 'Users' }],
      schemas: [{ id: 's1', name: 'UserResponse' }],
      authSchemes: [],
      endpoints: [
        {
          resourceId: 'r1',
          requestBodySchemaId: null,
          responseShapeSchemaId: 's1',
          authSchemeIds: [],
        },
      ],
    })

    const rY = result.resources[0]!.positionY
    const sY = result.schemas[0]!.positionY
    expect(Math.abs(rY - sY)).toBeLessThan(400)
  })

  it('places resources between auth and schemas in mixed connected layout', () => {
    const result = computeAutoLayout({
      resources: [{ id: 'r1', name: 'Users' }],
      schemas: [{ id: 's1', name: 'User' }],
      authSchemes: [{ id: 'a1', name: 'Bearer' }],
      endpoints: [
        {
          resourceId: 'r1',
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: ['a1'],
        },
      ],
    })

    expect(result.resources).toHaveLength(1)
    expect(result.schemas).toHaveLength(1)
    expect(result.authSchemes).toHaveLength(1)

    expect(result.authSchemes[0]!.positionX).toBeLessThan(
      result.resources[0]!.positionX,
    )
    expect(result.resources[0]!.positionX).toBeLessThan(
      result.schemas[0]!.positionX,
    )
  })

  it('returns positions as non-negative integers', () => {
    const result = computeAutoLayout({
      resources: [{ id: 'r1', name: 'Users' }],
      schemas: [{ id: 's1', name: 'User' }],
      authSchemes: [{ id: 'a1', name: 'Bearer' }],
      endpoints: [
        {
          resourceId: 'r1',
          requestBodySchemaId: 's1',
          responseShapeSchemaId: null,
          authSchemeIds: ['a1'],
        },
      ],
    })

    for (const entity of [
      ...result.resources,
      ...result.schemas,
      ...result.authSchemes,
    ]) {
      expect(entity.positionX).toBeGreaterThanOrEqual(0)
      expect(entity.positionY).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(entity.positionX)).toBe(true)
      expect(Number.isInteger(entity.positionY)).toBe(true)
    }
  })

  it('ignores references to non-existent schemas', () => {
    const result = computeAutoLayout({
      resources: [{ id: 'r1', name: 'Users' }],
      schemas: [],
      authSchemes: [],
      endpoints: [
        {
          resourceId: 'r1',
          requestBodySchemaId: 'nonexistent-schema',
          responseShapeSchemaId: null,
          authSchemeIds: [],
        },
      ],
    })

    expect(result.resources).toHaveLength(1)
    expect(result.schemas).toHaveLength(0)
  })

  it('ignores references to non-existent auth schemes', () => {
    const result = computeAutoLayout({
      resources: [{ id: 'r1', name: 'Users' }],
      schemas: [],
      authSchemes: [],
      endpoints: [
        {
          resourceId: 'r1',
          requestBodySchemaId: null,
          responseShapeSchemaId: null,
          authSchemeIds: ['nonexistent-auth'],
        },
      ],
    })

    expect(result.resources).toHaveLength(1)
    expect(result.authSchemes).toHaveLength(0)
  })
})
