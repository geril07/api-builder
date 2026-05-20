import 'server-only'
import { stringify } from 'yaml'

import { db } from '@/shared/db/client'

export type OpenApiSpec = {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  tags?: { name: string; description?: string }[]
  paths: Record<
    string,
    Record<
      string,
      {
        tags?: string[]
        summary?: string
        parameters?: {
          name: string
          in: string
          description?: string
          required?: boolean
          schema: { type: string; items?: { type: string } }
        }[]
        requestBody?: unknown
        responses: Record<string, unknown>
        security?: { [key: string]: string[] }[]
      }
    >
  >
  components?: {
    schemas: Record<string, unknown>
    securitySchemes: Record<string, unknown>
  }
}

export type ExportResource = {
  name: string
  description: string | null
  endpoints: ExportEndpoint[]
}

export type ExportEndpoint = {
  method: string
  path: string
  summary: string | null
  requestBody: unknown | null
  responseShape: unknown | null
  requestBodySchemaId: string | null
  responseShapeSchemaId: string | null
  authSchemeIds: string[]
  queryParams: unknown
}

export type ExportSchema = {
  id: string
  name: string
  jsonSchema: unknown
}

export type ExportAuthScheme = {
  id: string
  name: string
  type: string
  config: unknown
}

export type DesignForExport = {
  name: string
  resources: ExportResource[]
  schemas: ExportSchema[]
  authSchemes: ExportAuthScheme[]
}

export function buildOpenApiSpec(design: DesignForExport): OpenApiSpec {
  const spec: OpenApiSpec = {
    openapi: '3.0.3',
    info: {
      title: design.name,
      version: '0.1.0',
    },
    tags: design.resources.map((r) => ({
      name: r.name,
      description: r.description ?? undefined,
    })),
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {},
    },
  }

  for (const schema of design.schemas) {
    spec.components!.schemas[schema.name] = schema.jsonSchema
  }

  for (const authScheme of design.authSchemes) {
    spec.components!.securitySchemes[authScheme.name] = {
      type: authScheme.type,
      ...(authScheme.config as Record<string, unknown>),
    }
  }

  for (const resource of design.resources) {
    for (const endpoint of resource.endpoints) {
      const pathKey = endpoint.path.startsWith('/')
        ? endpoint.path
        : `/${endpoint.path}`

      if (!spec.paths[pathKey]) {
        spec.paths[pathKey] = {}
      }

      const method = endpoint.method.toLowerCase()
      const operation: OpenApiSpec['paths'][string][string] = {
        tags: [resource.name],
        responses: { '200': { description: 'Successful response' } },
      }

      if (endpoint.summary) {
        operation.summary = endpoint.summary
      }

      const rawParams = endpoint.queryParams
      const queryParams: {
        name: string
        description?: string | null
        required?: boolean
        type?: string
        allowMultiple?: boolean
      }[] = Array.isArray(rawParams) ? rawParams : []
      if (queryParams.length > 0) {
        operation.parameters = queryParams.map((p) => ({
          name: p.name,
          in: 'query',
          description: p.description ?? undefined,
          required: p.required ?? false,
          schema: p.allowMultiple
            ? { type: 'array', items: { type: p.type ?? 'string' } }
            : { type: p.type ?? 'string' },
        }))
      }

      if (endpoint.requestBodySchemaId) {
        const schema = design.schemas.find(
          (s) => s.id === endpoint.requestBodySchemaId,
        )
        if (schema) {
          operation.requestBody = {
            content: {
              'application/json': {
                schema: { $ref: `#/components/schemas/${schema.name}` },
              },
            },
          }
        }
      } else if (endpoint.requestBody) {
        operation.requestBody = {
          content: {
            'application/json': {
              schema: endpoint.requestBody,
            },
          },
        }
      }

      if (endpoint.responseShapeSchemaId) {
        const schema = design.schemas.find(
          (s) => s.id === endpoint.responseShapeSchemaId,
        )
        if (schema) {
          operation.responses = {
            '200': {
              description: 'Successful response',
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${schema.name}` },
                },
              },
            },
          }
        }
      } else if (endpoint.responseShape) {
        operation.responses = {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: endpoint.responseShape,
              },
            },
          },
        }
      }

      const rawIds = endpoint.authSchemeIds
      const schemes: string[] = Array.isArray(rawIds) ? rawIds.map(String) : []
      if (schemes.length > 0) {
        operation.security = schemes.map((schemeId) => {
          const scheme = design.authSchemes.find((s) => s.id === schemeId)
          return { [scheme?.name ?? schemeId]: [] }
        })
      }

      spec.paths[pathKey][method] = operation
    }
  }

  return spec
}

export function serializeSpec(
  spec: OpenApiSpec,
  format: 'json' | 'yaml',
): string {
  return format === 'yaml'
    ? stringify(spec, { lineWidth: 0 })
    : JSON.stringify(spec, null, 2)
}

export async function exportApiDesign(
  apiDesignId: string,
  workspaceId: string,
  format: 'json' | 'yaml',
): Promise<string> {
  const design = await db.query.apiDesignsTable.findFirst({
    where: (fields, { eq: e, and }) =>
      and(e(fields.id, apiDesignId), e(fields.workspaceId, workspaceId)),
    with: {
      resources: {
        with: {
          endpoints: {
            with: {
              authSchemeLinks: {
                columns: { authSchemeId: true },
                orderBy: (links, { asc }) => [asc(links.authSchemeId)],
              },
            },
            orderBy: (endpoints, { asc }) => [
              asc(endpoints.sortOrder),
              asc(endpoints.createdAt),
            ],
          },
        },
      },
      schemas: true,
      authSchemes: true,
    },
  })

  if (!design) {
    throw new Error('API design not found.')
  }

  const spec = buildOpenApiSpec({
    name: design.name,
    resources: design.resources.map((resource) => ({
      ...resource,
      endpoints: resource.endpoints.map(({ authSchemeLinks, ...endpoint }) => ({
        ...endpoint,
        authSchemeIds: authSchemeLinks.map((link) => link.authSchemeId),
      })),
    })),
    schemas: design.schemas,
    authSchemes: design.authSchemes,
  })
  return serializeSpec(spec, format)
}
