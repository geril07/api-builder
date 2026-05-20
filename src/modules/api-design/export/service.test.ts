import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}))

vi.mock('@/shared/db/client', () => ({
  db: {
    query: {
      apiDesignsTable: { findFirst: mockFindFirst },
    },
  },
}))

import {
  buildOpenApiSpec,
  serializeSpec,
  exportApiDesign,
  type DesignForExport,
  type OpenApiSpec,
} from './service'

function mockDesign(overrides: Partial<DesignForExport> = {}): DesignForExport {
  return {
    name: 'Test API',
    resources: [],
    schemas: [],
    authSchemes: [],
    ...overrides,
  }
}

describe('buildOpenApiSpec', () => {
  it('builds a minimal spec from an empty design', () => {
    const spec = buildOpenApiSpec(mockDesign())

    expect(spec.openapi).toBe('3.0.3')
    expect(spec.info.title).toBe('Test API')
    expect(spec.info.version).toBe('0.1.0')
    expect(spec.tags).toEqual([])
    expect(spec.paths).toEqual({})
    expect(spec.components).toEqual({
      schemas: {},
      securitySchemes: {},
    })
  })

  it('creates tags from resources', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        resources: [
          {
            name: 'Users',
            description: 'User operations',
            endpoints: [],
          },
          {
            name: 'Orders',
            description: null,
            endpoints: [],
          },
        ],
      }),
    )

    expect(spec.tags).toEqual([
      { name: 'Users', description: 'User operations' },
      { name: 'Orders', description: undefined },
    ])
  })

  it('creates path entries for each endpoint', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'GET',
                path: '/users',
                summary: 'List users',
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: null,
                responseShapeSchemaId: null,
                authSchemeIds: [],
                queryParams: [],
              },
              {
                method: 'POST',
                path: '/users',
                summary: null,
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: null,
                responseShapeSchemaId: null,
                authSchemeIds: [],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    expect(spec.paths['/users']).toBeDefined()
    expect(spec.paths['/users']!['get']).toBeDefined()
    expect(spec.paths['/users']!['get']!.tags).toEqual(['Users'])
    expect(spec.paths['/users']!['get']!.summary).toBe('List users')
    expect(spec.paths['/users']!['post']).toBeDefined()
    expect(spec.paths['/users']!['post']!.tags).toEqual(['Users'])
  })

  it('prepends a leading slash to paths that lack one', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'GET',
                path: 'users',
                summary: null,
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: null,
                responseShapeSchemaId: null,
                authSchemeIds: [],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    expect(spec.paths['/users']).toBeDefined()
  })

  it('includes component schemas', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        schemas: [
          { id: 's1', name: 'User', jsonSchema: { type: 'object' } },
          { id: 's2', name: 'Order', jsonSchema: { type: 'object' } },
        ],
      }),
    )

    expect(spec.components!.schemas['User']).toEqual({ type: 'object' })
    expect(spec.components!.schemas['Order']).toEqual({ type: 'object' })
  })

  it('includes security scheme components', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        authSchemes: [
          {
            id: 'a1',
            name: 'bearerAuth',
            type: 'bearer',
            config: { scheme: 'bearer', bearerFormat: 'JWT' },
          },
        ],
      }),
    )

    expect(spec.components!.securitySchemes['bearerAuth']).toEqual({
      type: 'bearer',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
  })

  it('resolves $ref for request body schema', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        schemas: [{ id: 's1', name: 'CreateUser', jsonSchema: {} }],
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'POST',
                path: '/users',
                summary: null,
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: 's1',
                responseShapeSchemaId: null,
                authSchemeIds: [],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    const body = spec.paths['/users']!['post']!.requestBody as {
      content: { 'application/json': { schema: { $ref: string } } }
    }
    expect(body.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/CreateUser',
    )
  })

  it('resolves $ref for response shape schema', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        schemas: [{ id: 's1', name: 'User', jsonSchema: {} }],
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'GET',
                path: '/users/{id}',
                summary: null,
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: null,
                responseShapeSchemaId: 's1',
                authSchemeIds: [],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    const responses = spec.paths['/users/{id}']!['get']!.responses as Record<
      string,
      { content: { 'application/json': { schema: { $ref: string } } } }
    >
    expect(responses['200']!.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/User',
    )
  })

  it('uses inline request body when no schema reference', () => {
    const inlineSchema = { type: 'object', properties: {} }
    const spec = buildOpenApiSpec(
      mockDesign({
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'POST',
                path: '/users',
                summary: null,
                requestBody: inlineSchema,
                responseShape: null,
                requestBodySchemaId: null,
                responseShapeSchemaId: null,
                authSchemeIds: [],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    const body = spec.paths['/users']!['post']!.requestBody as {
      content: { 'application/json': { schema: unknown } }
    }
    expect(body.content['application/json'].schema).toEqual(inlineSchema)
  })

  it('uses inline response shape when no schema reference', () => {
    const inlineSchema = { type: 'array', items: {} }
    const spec = buildOpenApiSpec(
      mockDesign({
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'GET',
                path: '/users',
                summary: null,
                requestBody: null,
                responseShape: inlineSchema,
                requestBodySchemaId: null,
                responseShapeSchemaId: null,
                authSchemeIds: [],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    const responses = spec.paths['/users']!['get']!.responses as Record<
      string,
      { content: { 'application/json': { schema: unknown } } }
    >
    expect(responses['200']!.content['application/json'].schema).toEqual(
      inlineSchema,
    )
  })

  it('applies auth schemes to endpoint operations', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        authSchemes: [
          { id: 'a1', name: 'bearerAuth', type: 'bearer', config: {} },
        ],
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'GET',
                path: '/users',
                summary: null,
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: null,
                responseShapeSchemaId: null,
                authSchemeIds: ['a1'],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    expect(spec.paths['/users']!['get']!.security).toEqual([{ bearerAuth: [] }])
  })

  it('handles multiple auth schemes on an endpoint', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        authSchemes: [
          { id: 'a1', name: 'bearerAuth', type: 'bearer', config: {} },
          { id: 'a2', name: 'apiKey', type: 'apiKey', config: {} },
        ],
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'GET',
                path: '/users',
                summary: null,
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: null,
                responseShapeSchemaId: null,
                authSchemeIds: ['a1', 'a2'],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    expect(spec.paths['/users']!['get']!.security).toEqual([
      { bearerAuth: [] },
      { apiKey: [] },
    ])
  })

  it('falls back to scheme id when auth scheme name is missing', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        authSchemes: [],
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'GET',
                path: '/users',
                summary: null,
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: null,
                responseShapeSchemaId: null,
                authSchemeIds: ['missing-scheme'],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    expect(spec.paths['/users']!['get']!.security).toEqual([
      { 'missing-scheme': [] },
    ])
  })

  it('skips request body when schema reference is not found', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        schemas: [],
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'POST',
                path: '/users',
                summary: null,
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: 'nonexistent',
                responseShapeSchemaId: null,
                authSchemeIds: [],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    expect(spec.paths['/users']!['post']!.requestBody).toBeUndefined()
  })

  it('endpoint without auth schemes has no security field', () => {
    const spec = buildOpenApiSpec(
      mockDesign({
        resources: [
          {
            name: 'Users',
            description: null,
            endpoints: [
              {
                method: 'GET',
                path: '/users',
                summary: null,
                requestBody: null,
                responseShape: null,
                requestBodySchemaId: null,
                responseShapeSchemaId: null,
                authSchemeIds: [],
                queryParams: [],
              },
            ],
          },
        ],
      }),
    )

    expect(spec.paths['/users']!['get']!.security).toBeUndefined()
  })
})

describe('serializeSpec', () => {
  const minimalSpec: OpenApiSpec = {
    openapi: '3.0.3',
    info: { title: 'Test', version: '1.0.0' },
    paths: {},
  }

  it('serializes to JSON', () => {
    const result = serializeSpec(minimalSpec, 'json')
    const parsed = JSON.parse(result)
    expect(parsed.openapi).toBe('3.0.3')
    expect(parsed.info.title).toBe('Test')
  })

  it('serializes to YAML', () => {
    const result = serializeSpec(minimalSpec, 'yaml')
    expect(result).toContain('openapi: 3.0.3')
    expect(result).toContain('title: Test')
  })
})

describe('exportApiDesign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches the design and returns serialized spec', async () => {
    mockFindFirst.mockResolvedValue({
      name: 'Petstore',
      resources: [
        {
          name: 'Pets',
          description: null,
          endpoints: [
            {
              method: 'GET',
              path: '/pets',
              summary: 'List pets',
              requestBody: null,
              responseShape: null,
              requestBodySchemaId: null,
              responseShapeSchemaId: null,
              authSchemeLinks: [],
              queryParams: [],
            },
          ],
        },
      ],
      schemas: [],
      authSchemes: [],
    })

    const result = await exportApiDesign('design-1', 'ws-1', 'json')
    const parsed = JSON.parse(result)

    expect(mockFindFirst).toHaveBeenCalledTimes(1)
    expect(parsed.info.title).toBe('Petstore')
    expect(parsed.paths['/pets']).toBeDefined()
  })

  it('throws when design is not found', async () => {
    mockFindFirst.mockResolvedValue(null)

    await expect(exportApiDesign('missing', 'ws-1', 'json')).rejects.toThrow(
      'API design not found.',
    )
  })
})
