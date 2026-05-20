import 'server-only'
import { and, desc, eq, inArray } from 'drizzle-orm'

import { db } from '@/shared/db/client'
import {
  apiDesignAuthSchemesTable,
  apiDesignEndpointAuthSchemesTable,
  apiDesignEndpointsTable,
  apiDesignResourcesTable,
  apiDesignsTable,
} from '@/shared/db/schema'
import { resolveResourceOwnership } from '@/modules/api-design/resources/service'

function apiDesignResourceIds(apiDesignId: string, workspaceId: string) {
  return db
    .select({ id: apiDesignResourcesTable.id })
    .from(apiDesignResourcesTable)
    .innerJoin(
      apiDesignsTable,
      eq(apiDesignResourcesTable.apiDesignId, apiDesignsTable.id),
    )
    .where(
      and(
        eq(apiDesignsTable.id, apiDesignId),
        eq(apiDesignsTable.workspaceId, workspaceId),
      ),
    )
}

export async function createEndpoint(input: {
  apiDesignId: string
  resourceId: string
  workspaceId: string
  method: string
  path: string
  summary?: string | null
  requestBody?: string | null
  responseShape?: string | null
  requestBodySchemaId?: string | null
  responseShapeSchemaId?: string | null
  authSchemeIds?: string[]
  queryParams?: {
    name: string
    description?: string | null
    required?: boolean
    type?: string
    allowMultiple?: boolean
  }[]
}): Promise<{ id: string }> {
  const resource = await resolveResourceOwnership(
    input.resourceId,
    input.workspaceId,
  )

  if (!resource) {
    throw new Error('Resource not found.')
  }

  if (resource.apiDesignId !== input.apiDesignId) {
    throw new Error('Resource not found.')
  }

  return db.transaction(async (tx) => {
    const [lastEndpoint] = await tx
      .select({ sortOrder: apiDesignEndpointsTable.sortOrder })
      .from(apiDesignEndpointsTable)
      .where(eq(apiDesignEndpointsTable.resourceId, input.resourceId))
      .orderBy(desc(apiDesignEndpointsTable.sortOrder))
      .limit(1)

    const [endpoint] = await tx
      .insert(apiDesignEndpointsTable)
      .values({
        resourceId: input.resourceId,
        method: input.method,
        path: input.path,
        summary: input.summary ?? null,
        requestBody: input.requestBody ?? null,
        responseShape: input.responseShape ?? null,
        requestBodySchemaId: input.requestBodySchemaId ?? null,
        responseShapeSchemaId: input.responseShapeSchemaId ?? null,
        queryParams: input.queryParams ?? [],
        sortOrder: (lastEndpoint?.sortOrder ?? -1) + 1,
      })
      .returning({ id: apiDesignEndpointsTable.id })

    if (!endpoint) {
      throw new Error('Failed to create endpoint.')
    }

    const authSchemeIds = [...new Set(input.authSchemeIds ?? [])]
    if (authSchemeIds.length > 0) {
      const authSchemes = await tx
        .select({ id: apiDesignAuthSchemesTable.id })
        .from(apiDesignAuthSchemesTable)
        .where(
          and(
            eq(apiDesignAuthSchemesTable.apiDesignId, input.apiDesignId),
            inArray(apiDesignAuthSchemesTable.id, authSchemeIds),
          ),
        )

      if (authSchemes.length !== authSchemeIds.length) {
        throw new Error('Auth scheme not found.')
      }

      await tx.insert(apiDesignEndpointAuthSchemesTable).values(
        authSchemeIds.map((authSchemeId) => ({
          endpointId: endpoint.id,
          authSchemeId,
        })),
      )
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))

    return { id: endpoint.id }
  })
}

export async function reorderEndpoints(input: {
  apiDesignId: string
  resourceId: string
  workspaceId: string
  endpointIds: string[]
}): Promise<void> {
  const resource = await resolveResourceOwnership(
    input.resourceId,
    input.workspaceId,
  )

  if (!resource) {
    throw new Error('Resource not found.')
  }

  if (resource.apiDesignId !== input.apiDesignId) {
    throw new Error('Resource not found.')
  }

  const uniqueEndpointIds = new Set(input.endpointIds)
  if (uniqueEndpointIds.size !== input.endpointIds.length) {
    throw new Error('Endpoint order contains duplicate endpoints.')
  }

  await db.transaction(async (tx) => {
    const endpoints = await tx
      .select({ id: apiDesignEndpointsTable.id })
      .from(apiDesignEndpointsTable)
      .where(eq(apiDesignEndpointsTable.resourceId, input.resourceId))

    if (endpoints.length !== input.endpointIds.length) {
      throw new Error('Endpoint order does not match the resource endpoints.')
    }

    const existingEndpointIds = new Set(
      endpoints.map((endpoint) => endpoint.id),
    )
    for (const endpointId of input.endpointIds) {
      if (!existingEndpointIds.has(endpointId)) {
        throw new Error('Endpoint order contains an invalid endpoint.')
      }
    }

    for (const [sortOrder, endpointId] of input.endpointIds.entries()) {
      await tx
        .update(apiDesignEndpointsTable)
        .set({ sortOrder, updatedAt: new Date() })
        .where(eq(apiDesignEndpointsTable.id, endpointId))
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}

export async function updateEndpoint(input: {
  endpointId: string
  apiDesignId: string
  workspaceId: string
  method?: string
  path?: string
  summary?: string | null
  requestBody?: string | null
  responseShape?: string | null
  requestBodySchemaId?: string | null
  responseShapeSchemaId?: string | null
  authSchemeIds?: string[]
  queryParams?: {
    name: string
    description?: string | null
    required?: boolean
    type?: string
    allowMultiple?: boolean
  }[]
}): Promise<void> {
  const updates: Partial<typeof apiDesignEndpointsTable.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.method !== undefined) updates.method = input.method
  if (input.path !== undefined) updates.path = input.path
  if (input.summary !== undefined) updates.summary = input.summary
  if (input.requestBody !== undefined) updates.requestBody = input.requestBody
  if (input.responseShape !== undefined)
    updates.responseShape = input.responseShape
  if (input.requestBodySchemaId !== undefined)
    updates.requestBodySchemaId = input.requestBodySchemaId
  if (input.responseShapeSchemaId !== undefined)
    updates.responseShapeSchemaId = input.responseShapeSchemaId
  if (input.queryParams !== undefined) updates.queryParams = input.queryParams

  await db.transaction(async (tx) => {
    const [result] = await tx
      .update(apiDesignEndpointsTable)
      .set(updates)
      .where(
        and(
          eq(apiDesignEndpointsTable.id, input.endpointId),
          inArray(
            apiDesignEndpointsTable.resourceId,
            apiDesignResourceIds(input.apiDesignId, input.workspaceId),
          ),
        ),
      )
      .returning({ id: apiDesignEndpointsTable.id })

    if (!result) {
      throw new Error('Endpoint not found.')
    }

    if (input.authSchemeIds !== undefined) {
      await tx
        .delete(apiDesignEndpointAuthSchemesTable)
        .where(
          eq(apiDesignEndpointAuthSchemesTable.endpointId, input.endpointId),
        )

      const authSchemeIds = [...new Set(input.authSchemeIds)]
      if (authSchemeIds.length > 0) {
        const authSchemes = await tx
          .select({ id: apiDesignAuthSchemesTable.id })
          .from(apiDesignAuthSchemesTable)
          .where(
            and(
              eq(apiDesignAuthSchemesTable.apiDesignId, input.apiDesignId),
              inArray(apiDesignAuthSchemesTable.id, authSchemeIds),
            ),
          )

        if (authSchemes.length !== authSchemeIds.length) {
          throw new Error('Auth scheme not found.')
        }

        await tx.insert(apiDesignEndpointAuthSchemesTable).values(
          authSchemeIds.map((authSchemeId) => ({
            endpointId: input.endpointId,
            authSchemeId,
          })),
        )
      }
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}

export async function deleteEndpoint(input: {
  endpointId: string
  apiDesignId: string
  workspaceId: string
}): Promise<void> {
  await db.transaction(async (tx) => {
    const [result] = await tx
      .delete(apiDesignEndpointsTable)
      .where(
        and(
          eq(apiDesignEndpointsTable.id, input.endpointId),
          inArray(
            apiDesignEndpointsTable.resourceId,
            apiDesignResourceIds(input.apiDesignId, input.workspaceId),
          ),
        ),
      )
      .returning({ id: apiDesignEndpointsTable.id })

    if (!result) {
      throw new Error('Endpoint not found.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}
