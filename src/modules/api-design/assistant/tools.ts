import 'server-only'
import { tool } from 'ai'
import { eq } from 'drizzle-orm'
import * as z from 'zod'

import { db } from '@/shared/db/client'
import {
  apiDesignAuthSchemesTable,
  apiDesignEndpointsTable,
  apiDesignResourcesTable,
  apiDesignSchemasTable,
} from '@/shared/db/schema'

async function getResourceName(resourceId: string): Promise<string> {
  const [row] = await db
    .select({ name: apiDesignResourcesTable.name })
    .from(apiDesignResourcesTable)
    .where(eq(apiDesignResourcesTable.id, resourceId))
    .limit(1)
  return row?.name ?? resourceId
}

async function getEndpointLabel(endpointId: string): Promise<string> {
  const [row] = await db
    .select({
      method: apiDesignEndpointsTable.method,
      path: apiDesignEndpointsTable.path,
    })
    .from(apiDesignEndpointsTable)
    .where(eq(apiDesignEndpointsTable.id, endpointId))
    .limit(1)
  return row ? `${row.method.toUpperCase()} ${row.path}` : endpointId
}

async function getSchemaName(schemaId: string): Promise<string> {
  const [row] = await db
    .select({ name: apiDesignSchemasTable.name })
    .from(apiDesignSchemasTable)
    .where(eq(apiDesignSchemasTable.id, schemaId))
    .limit(1)
  return row?.name ?? schemaId
}

async function getAuthSchemeName(authSchemeId: string): Promise<string> {
  const [row] = await db
    .select({ name: apiDesignAuthSchemesTable.name })
    .from(apiDesignAuthSchemesTable)
    .where(eq(apiDesignAuthSchemesTable.id, authSchemeId))
    .limit(1)
  return row?.name ?? authSchemeId
}

function createAgentTools(apiDesignId: string, workspaceId: string) {
  return {
    createResource: tool({
      description:
        'Create a new resource (data model / entity) in the API design',
      inputSchema: z.object({
        name: z
          .string()
          .describe('Resource name (e.g. Users, Orders, Products)'),
        description: z.string().nullable().optional(),
        positionX: z.number().optional().describe('X position on canvas'),
        positionY: z.number().optional().describe('Y position on canvas'),
      }),
      execute: async (input) => {
        const { createResource } =
          await import('@/modules/api-design/resources/service')
        const result = await createResource({
          apiDesignId,
          workspaceId,
          name: input.name,
          description: input.description ?? null,
          positionX: input.positionX ?? Math.round(100 + Math.random() * 300),
          positionY: input.positionY ?? Math.round(100 + Math.random() * 300),
        })
        return {
          ...result,
          name: input.name,
          summary: `Created resource "${input.name}"`,
        }
      },
    }),
    updateResource: tool({
      description: 'Update an existing resource',
      inputSchema: z.object({
        resourceId: z.string().describe('ID of the resource to update'),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
      }),
      execute: async (input) => {
        const name = input.name ?? (await getResourceName(input.resourceId))
        const { updateResource } =
          await import('@/modules/api-design/resources/service')
        await updateResource({
          resourceId: input.resourceId,
          apiDesignId,
          workspaceId,
          name: input.name,
          description: input.description,
        })
        return { success: true, name, summary: `Updated resource "${name}"` }
      },
    }),
    deleteResource: tool({
      description: 'Delete a resource',
      inputSchema: z.object({
        resourceId: z.string().describe('ID of the resource to delete'),
      }),
      execute: async (input) => {
        const name = await getResourceName(input.resourceId)
        const { deleteResource } =
          await import('@/modules/api-design/resources/service')
        await deleteResource({
          resourceId: input.resourceId,
          apiDesignId,
          workspaceId,
        })
        return { success: true, name, summary: `Deleted resource "${name}"` }
      },
    }),
    createEndpoint: tool({
      description: 'Create a new endpoint on an existing resource',
      inputSchema: z.object({
        resourceId: z.string().describe('ID of the parent resource'),
        method: z
          .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
          .describe('HTTP method'),
        path: z.string().describe('Endpoint path (e.g. /users or /users/:id)'),
        summary: z.string().nullable().optional(),
        requestBody: z
          .unknown()
          .nullable()
          .optional()
          .describe(
            'JSON object describing an INLINE request body shape. Use a JSON Schema-compatible object. Prefer createSchema + requestBodySchemaId instead — only use this for one-off shapes that will never be reused.',
          ),
        responseShape: z
          .unknown()
          .nullable()
          .optional()
          .describe(
            'JSON object describing an INLINE response shape. Use a JSON Schema-compatible object. Prefer createSchema + responseShapeSchemaId instead — only use this for one-off shapes that will never be reused.',
          ),
        requestBodySchemaId: z
          .string()
          .nullable()
          .optional()
          .describe(
            'ID of an existing schema to reference as request body. PREFER THIS over requestBody for any reusable shape.',
          ),
        responseShapeSchemaId: z
          .string()
          .nullable()
          .optional()
          .describe(
            'ID of an existing schema to reference as response shape. PREFER THIS over responseShape for any reusable shape.',
          ),
        authSchemeIds: z.array(z.string()).optional(),
        queryParams: z
          .array(
            z.object({
              name: z.string().describe('Query parameter name'),
              description: z.string().nullable().optional(),
              required: z.boolean().optional(),
              type: z
                .enum(['string', 'number', 'integer', 'boolean'])
                .optional(),
              allowMultiple: z.boolean().optional(),
            }),
          )
          .optional()
          .describe('Query/search parameters for this endpoint'),
      }),
      execute: async (input) => {
        const resourceName = await getResourceName(input.resourceId)
        const { createEndpoint } =
          await import('@/modules/api-design/endpoints/service')
        const result = await createEndpoint({
          apiDesignId,
          resourceId: input.resourceId,
          workspaceId,
          method: input.method,
          path: input.path,
          summary: input.summary ?? null,
          requestBody:
            input.requestBody != null
              ? JSON.stringify(input.requestBody)
              : null,
          responseShape:
            input.responseShape != null
              ? JSON.stringify(input.responseShape)
              : null,
          requestBodySchemaId: input.requestBodySchemaId ?? null,
          responseShapeSchemaId: input.responseShapeSchemaId ?? null,
          authSchemeIds: input.authSchemeIds ?? [],
          queryParams: input.queryParams ?? [],
        })
        const label = `${input.method.toUpperCase()} ${input.path}`
        return {
          ...result,
          method: input.method,
          path: input.path,
          resourceName,
          summary: `Added ${label} on "${resourceName}"`,
        }
      },
    }),
    updateEndpoint: tool({
      description: 'Update an existing endpoint',
      inputSchema: z.object({
        endpointId: z.string().describe('ID of the endpoint to update'),
        method: z
          .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
          .optional(),
        path: z.string().optional(),
        summary: z.string().nullable().optional(),
        requestBody: z
          .unknown()
          .nullable()
          .optional()
          .describe(
            'JSON object describing an INLINE request body shape. Prefer requestBodySchemaId instead — only use for one-off shapes.',
          ),
        responseShape: z
          .unknown()
          .nullable()
          .optional()
          .describe(
            'JSON object describing an INLINE response shape. Prefer responseShapeSchemaId instead — only use for one-off shapes.',
          ),
        requestBodySchemaId: z
          .string()
          .nullable()
          .optional()
          .describe(
            'ID of an existing schema to reference as request body. PREFER THIS over requestBody.',
          ),
        responseShapeSchemaId: z
          .string()
          .nullable()
          .optional()
          .describe(
            'ID of an existing schema to reference as response shape. PREFER THIS over responseShape.',
          ),
        authSchemeIds: z.array(z.string()).optional(),
        queryParams: z
          .array(
            z.object({
              name: z.string().describe('Query parameter name'),
              description: z.string().nullable().optional(),
              required: z.boolean().optional(),
              type: z
                .enum(['string', 'number', 'integer', 'boolean'])
                .optional(),
              allowMultiple: z.boolean().optional(),
            }),
          )
          .optional()
          .describe('Query/search parameters for this endpoint'),
      }),
      execute: async (input) => {
        const { updateEndpoint } =
          await import('@/modules/api-design/endpoints/service')
        await updateEndpoint({
          endpointId: input.endpointId,
          apiDesignId,
          workspaceId,
          method: input.method,
          path: input.path,
          summary: input.summary,
          requestBody:
            input.requestBody !== undefined
              ? input.requestBody !== null
                ? JSON.stringify(input.requestBody)
                : null
              : undefined,
          responseShape:
            input.responseShape !== undefined
              ? input.responseShape !== null
                ? JSON.stringify(input.responseShape)
                : null
              : undefined,
          requestBodySchemaId: input.requestBodySchemaId,
          responseShapeSchemaId: input.responseShapeSchemaId,
          authSchemeIds: input.authSchemeIds,
          queryParams: input.queryParams,
        })
        const label =
          input.method && input.path
            ? `${input.method.toUpperCase()} ${input.path}`
            : await getEndpointLabel(input.endpointId)
        return { success: true, label, summary: `Updated endpoint ${label}` }
      },
    }),
    deleteEndpoint: tool({
      description: 'Delete an endpoint',
      inputSchema: z.object({
        endpointId: z.string().describe('ID of the endpoint to delete'),
      }),
      execute: async (input) => {
        const label = await getEndpointLabel(input.endpointId)
        const { deleteEndpoint } =
          await import('@/modules/api-design/endpoints/service')
        await deleteEndpoint({
          endpointId: input.endpointId,
          apiDesignId,
          workspaceId,
        })
        return { success: true, label, summary: `Deleted endpoint ${label}` }
      },
    }),
    createSchema: tool({
      description:
        'Create a reusable JSON schema definition (e.g. DTOs, error responses, pagination)',
      inputSchema: z.object({
        name: z.string().describe('Schema name (e.g. UserDto, ErrorResponse)'),
        description: z.string().nullable().optional(),
        jsonSchema: z.unknown().describe('The JSON Schema definition'),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
      }),
      execute: async (input) => {
        const { createSchema } =
          await import('@/modules/api-design/schemas/service')
        const result = await createSchema({
          apiDesignId,
          workspaceId,
          name: input.name,
          description: input.description ?? null,
          jsonSchema: input.jsonSchema,
          positionX: input.positionX ?? 0,
          positionY: input.positionY ?? 0,
        })
        return {
          ...result,
          name: input.name,
          summary: `Created schema "${input.name}"`,
        }
      },
    }),
    updateSchema: tool({
      description: 'Update an existing schema',
      inputSchema: z.object({
        schemaId: z.string().describe('ID of the schema to update'),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        jsonSchema: z.unknown().optional(),
      }),
      execute: async (input) => {
        const name = input.name ?? (await getSchemaName(input.schemaId))
        const { updateSchema } =
          await import('@/modules/api-design/schemas/service')
        await updateSchema({
          schemaId: input.schemaId,
          apiDesignId,
          workspaceId,
          name: input.name,
          description: input.description,
          jsonSchema: input.jsonSchema,
        })
        return { success: true, name, summary: `Updated schema "${name}"` }
      },
    }),
    deleteSchema: tool({
      description: 'Delete a schema',
      inputSchema: z.object({
        schemaId: z.string().describe('ID of the schema to delete'),
      }),
      execute: async (input) => {
        const name = await getSchemaName(input.schemaId)
        const { deleteSchema } =
          await import('@/modules/api-design/schemas/service')
        await deleteSchema({
          schemaId: input.schemaId,
          apiDesignId,
          workspaceId,
        })
        return { success: true, name, summary: `Deleted schema "${name}"` }
      },
    }),
    createAuthScheme: tool({
      description:
        'Create an authentication scheme (bearer, apiKey, oauth2, openIdConnect)',
      inputSchema: z.object({
        name: z.string().describe('Auth scheme name (e.g. bearerAuth, apiKey)'),
        type: z.enum(['bearer', 'apiKey', 'oauth2', 'openIdConnect']),
        config: z.unknown().describe('Auth configuration object'),
        positionX: z.number().optional(),
        positionY: z.number().optional(),
      }),
      execute: async (input) => {
        const { createAuthScheme } =
          await import('@/modules/api-design/auth-schemes/service')
        const result = await createAuthScheme({
          apiDesignId,
          workspaceId,
          name: input.name,
          type: input.type,
          config: input.config,
          positionX: input.positionX ?? 0,
          positionY: input.positionY ?? 0,
        })
        return {
          ...result,
          name: input.name,
          type: input.type,
          summary: `Created auth "${input.name}" (${input.type})`,
        }
      },
    }),
    updateAuthScheme: tool({
      description: 'Update an existing auth scheme',
      inputSchema: z.object({
        authSchemeId: z.string().describe('ID of the auth scheme to update'),
        name: z.string().optional(),
        type: z
          .enum(['bearer', 'apiKey', 'oauth2', 'openIdConnect'])
          .optional(),
        config: z.unknown().optional(),
      }),
      execute: async (input) => {
        const name = input.name ?? (await getAuthSchemeName(input.authSchemeId))
        const { updateAuthScheme } =
          await import('@/modules/api-design/auth-schemes/service')
        await updateAuthScheme({
          authSchemeId: input.authSchemeId,
          apiDesignId,
          workspaceId,
          name: input.name,
          type: input.type,
          config: input.config,
        })
        return { success: true, name, summary: `Updated auth "${name}"` }
      },
    }),
    deleteAuthScheme: tool({
      description: 'Delete an auth scheme',
      inputSchema: z.object({
        authSchemeId: z.string().describe('ID of the auth scheme to delete'),
      }),
      execute: async (input) => {
        const name = await getAuthSchemeName(input.authSchemeId)
        const { deleteAuthScheme } =
          await import('@/modules/api-design/auth-schemes/service')
        await deleteAuthScheme({
          authSchemeId: input.authSchemeId,
          apiDesignId,
          workspaceId,
        })
        return { success: true, name, summary: `Deleted auth "${name}"` }
      },
    }),
  }
}

export { createAgentTools }
