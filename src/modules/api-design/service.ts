import 'server-only'
import { and, desc, eq, inArray } from 'drizzle-orm'

import { db } from '@/shared/db/client'
import {
  apiDesignAuthSchemesTable,
  apiDesignEndpointAuthSchemesTable,
  apiDesignEndpointsTable,
  apiDesignResourcesTable,
  apiDesignSchemasTable,
  apiDesignsTable,
} from '@/shared/db/schema'
import type { ApiDesignDto } from './types'

export async function resolveDesignOwnership(
  apiDesignId: string,
  workspaceId: string,
) {
  const design = await db.query.apiDesignsTable.findFirst({
    where: and(
      eq(apiDesignsTable.id, apiDesignId),
      eq(apiDesignsTable.workspaceId, workspaceId),
    ),
  })

  return design ?? null
}

export async function createApiDesign(input: {
  name: string
  workspaceId: string
  createdById: string
}): Promise<{ id: string }> {
  const [apiDesign] = await db
    .insert(apiDesignsTable)
    .values({
      workspaceId: input.workspaceId,
      createdById: input.createdById,
      name: input.name,
    })
    .returning({ id: apiDesignsTable.id })

  if (!apiDesign) {
    throw new Error('Failed to create API design.')
  }

  return { id: apiDesign.id }
}

export async function renameApiDesign(input: {
  apiDesignId: string
  workspaceId: string
  name: string
}): Promise<{ id: string }> {
  const [apiDesign] = await db
    .update(apiDesignsTable)
    .set({ name: input.name, updatedAt: new Date() })
    .where(
      and(
        eq(apiDesignsTable.id, input.apiDesignId),
        eq(apiDesignsTable.workspaceId, input.workspaceId),
      ),
    )
    .returning({ id: apiDesignsTable.id })

  if (!apiDesign) {
    throw new Error('API design not found.')
  }

  return { id: apiDesign.id }
}

export async function deleteApiDesign(input: {
  apiDesignId: string
  workspaceId: string
}): Promise<{ id: string }> {
  const [apiDesign] = await db
    .delete(apiDesignsTable)
    .where(
      and(
        eq(apiDesignsTable.id, input.apiDesignId),
        eq(apiDesignsTable.workspaceId, input.workspaceId),
      ),
    )
    .returning({ id: apiDesignsTable.id })

  if (!apiDesign) {
    throw new Error('API design not found.')
  }

  return { id: apiDesign.id }
}

export async function listApiDesigns(workspaceId: string) {
  return db.query.apiDesignsTable.findMany({
    where: eq(apiDesignsTable.workspaceId, workspaceId),
    with: {
      resources: {
        with: {
          endpoints: true,
        },
      },
    },
    orderBy: [desc(apiDesignsTable.updatedAt), desc(apiDesignsTable.createdAt)],
  })
}

export async function getApiDesignData(
  apiDesignId: string,
  workspaceId: string,
): Promise<ApiDesignDto | null> {
  const design = await resolveDesignOwnership(apiDesignId, workspaceId)

  if (!design) {
    return null
  }

  const resources = await db
    .select()
    .from(apiDesignResourcesTable)
    .where(eq(apiDesignResourcesTable.apiDesignId, apiDesignId))
    .orderBy(apiDesignResourcesTable.createdAt)

  const resourceIds = resources.map((r) => r.id)

  const endpointRows =
    resourceIds.length > 0
      ? await db
          .select()
          .from(apiDesignEndpointsTable)
          .where(inArray(apiDesignEndpointsTable.resourceId, resourceIds))
          .orderBy(
            apiDesignEndpointsTable.resourceId,
            apiDesignEndpointsTable.sortOrder,
            apiDesignEndpointsTable.createdAt,
          )
      : []

  const endpointIds = endpointRows.map((endpoint) => endpoint.id)
  const authSchemeLinks =
    endpointIds.length > 0
      ? await db
          .select({
            endpointId: apiDesignEndpointAuthSchemesTable.endpointId,
            authSchemeId: apiDesignEndpointAuthSchemesTable.authSchemeId,
          })
          .from(apiDesignEndpointAuthSchemesTable)
          .where(
            inArray(apiDesignEndpointAuthSchemesTable.endpointId, endpointIds),
          )
          .orderBy(
            apiDesignEndpointAuthSchemesTable.endpointId,
            apiDesignEndpointAuthSchemesTable.authSchemeId,
          )
      : []

  const authSchemeIdsByEndpointId = new Map<string, string[]>()
  for (const link of authSchemeLinks) {
    const ids = authSchemeIdsByEndpointId.get(link.endpointId) ?? []
    ids.push(link.authSchemeId)
    authSchemeIdsByEndpointId.set(link.endpointId, ids)
  }

  const endpoints = endpointRows.map((endpoint) => ({
    ...endpoint,
    authSchemeIds: authSchemeIdsByEndpointId.get(endpoint.id) ?? [],
  }))

  const schemas = await db
    .select()
    .from(apiDesignSchemasTable)
    .where(eq(apiDesignSchemasTable.apiDesignId, apiDesignId))
    .orderBy(apiDesignSchemasTable.createdAt)

  const authSchemes = await db
    .select()
    .from(apiDesignAuthSchemesTable)
    .where(eq(apiDesignAuthSchemesTable.apiDesignId, apiDesignId))
    .orderBy(apiDesignAuthSchemesTable.createdAt)

  return {
    name: design.name,
    resources,
    endpoints,
    schemas,
    authSchemes,
    updatedAt: design.updatedAt,
  } as ApiDesignDto
}

export async function autoLayout(input: {
  apiDesignId: string
  workspaceId: string
  resources: { id: string; positionX: number; positionY: number }[]
  schemas: { id: string; positionX: number; positionY: number }[]
  authSchemes: { id: string; positionX: number; positionY: number }[]
}): Promise<void> {
  const ownership = await resolveDesignOwnership(
    input.apiDesignId,
    input.workspaceId,
  )
  if (!ownership) {
    throw new Error('API design not found.')
  }

  await db.transaction(async (tx) => {
    for (const r of input.resources) {
      await tx
        .update(apiDesignResourcesTable)
        .set({
          positionX: r.positionX,
          positionY: r.positionY,
          updatedAt: new Date(),
        })
        .where(eq(apiDesignResourcesTable.id, r.id))
    }
    for (const s of input.schemas) {
      await tx
        .update(apiDesignSchemasTable)
        .set({
          positionX: s.positionX,
          positionY: s.positionY,
          updatedAt: new Date(),
        })
        .where(eq(apiDesignSchemasTable.id, s.id))
    }
    for (const a of input.authSchemes) {
      await tx
        .update(apiDesignAuthSchemesTable)
        .set({
          positionX: a.positionX,
          positionY: a.positionY,
          updatedAt: new Date(),
        })
        .where(eq(apiDesignAuthSchemesTable.id, a.id))
    }
    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}
