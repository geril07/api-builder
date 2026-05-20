import 'server-only'
import { and, eq } from 'drizzle-orm'

import { db } from '@/shared/db/client'
import { apiDesignResourcesTable, apiDesignsTable } from '@/shared/db/schema'
import { resolveDesignOwnership } from '@/modules/api-design/service'

export async function resolveResourceOwnership(
  resourceId: string,
  workspaceId: string,
) {
  if (resourceId.startsWith('optimistic-')) {
    return null
  }

  const [resource] = await db
    .select({
      id: apiDesignResourcesTable.id,
      apiDesignId: apiDesignResourcesTable.apiDesignId,
    })
    .from(apiDesignResourcesTable)
    .innerJoin(
      apiDesignsTable,
      eq(apiDesignResourcesTable.apiDesignId, apiDesignsTable.id),
    )
    .where(
      and(
        eq(apiDesignResourcesTable.id, resourceId),
        eq(apiDesignsTable.workspaceId, workspaceId),
      ),
    )
    .limit(1)

  return resource ?? null
}

export async function createResource(input: {
  apiDesignId: string
  workspaceId: string
  name: string
  description?: string | null
  positionX: number
  positionY: number
}): Promise<{ id: string }> {
  const design = await resolveDesignOwnership(
    input.apiDesignId,
    input.workspaceId,
  )

  if (!design) {
    throw new Error('API design not found.')
  }

  return db.transaction(async (tx) => {
    const [resource] = await tx
      .insert(apiDesignResourcesTable)
      .values({
        apiDesignId: input.apiDesignId,
        name: input.name,
        description: input.description ?? null,
        positionX: input.positionX,
        positionY: input.positionY,
      })
      .returning({ id: apiDesignResourcesTable.id })

    if (!resource) {
      throw new Error('Failed to create resource.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))

    return { id: resource.id }
  })
}

export async function updateResource(input: {
  resourceId: string
  apiDesignId: string
  workspaceId: string
  name?: string
  description?: string | null
  positionX?: number
  positionY?: number
}): Promise<void> {
  const resource = await resolveResourceOwnership(
    input.resourceId,
    input.workspaceId,
  )

  if (!resource) {
    throw new Error('Resource not found.')
  }

  const updates: Partial<typeof apiDesignResourcesTable.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) updates.name = input.name
  if (input.description !== undefined) updates.description = input.description
  if (input.positionX !== undefined) updates.positionX = input.positionX
  if (input.positionY !== undefined) updates.positionY = input.positionY

  await db.transaction(async (tx) => {
    const [result] = await tx
      .update(apiDesignResourcesTable)
      .set(updates)
      .where(
        and(
          eq(apiDesignResourcesTable.id, input.resourceId),
          eq(apiDesignResourcesTable.apiDesignId, input.apiDesignId),
        ),
      )
      .returning({ id: apiDesignResourcesTable.id })

    if (!result) {
      throw new Error('Resource not found.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}

export async function deleteResource(input: {
  resourceId: string
  apiDesignId: string
  workspaceId: string
}): Promise<void> {
  const resource = await resolveResourceOwnership(
    input.resourceId,
    input.workspaceId,
  )

  if (!resource) {
    throw new Error('Resource not found.')
  }

  await db.transaction(async (tx) => {
    const [result] = await tx
      .delete(apiDesignResourcesTable)
      .where(
        and(
          eq(apiDesignResourcesTable.id, input.resourceId),
          eq(apiDesignResourcesTable.apiDesignId, input.apiDesignId),
        ),
      )
      .returning({ id: apiDesignResourcesTable.id })

    if (!result) {
      throw new Error('Resource not found.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}
