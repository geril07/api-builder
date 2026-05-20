import 'server-only'
import { and, eq } from 'drizzle-orm'

import { db } from '@/shared/db/client'
import { apiDesignSchemasTable, apiDesignsTable } from '@/shared/db/schema'
import { resolveDesignOwnership } from '@/modules/api-design/service'

export async function createSchema(input: {
  apiDesignId: string
  workspaceId: string
  name: string
  description?: string | null
  jsonSchema: unknown
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
    const [schema] = await tx
      .insert(apiDesignSchemasTable)
      .values({
        apiDesignId: input.apiDesignId,
        name: input.name,
        description: input.description ?? null,
        jsonSchema: input.jsonSchema,
        positionX: input.positionX,
        positionY: input.positionY,
      })
      .returning({ id: apiDesignSchemasTable.id })

    if (!schema) {
      throw new Error('Failed to create schema.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))

    return { id: schema.id }
  })
}

export async function updateSchema(input: {
  schemaId: string
  apiDesignId: string
  workspaceId: string
  name?: string
  description?: string | null
  jsonSchema?: unknown
  positionX?: number
  positionY?: number
}): Promise<void> {
  const design = await resolveDesignOwnership(
    input.apiDesignId,
    input.workspaceId,
  )

  if (!design) {
    throw new Error('API design not found.')
  }

  const updates: Partial<typeof apiDesignSchemasTable.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) updates.name = input.name
  if (input.description !== undefined) updates.description = input.description
  if (input.jsonSchema !== undefined) updates.jsonSchema = input.jsonSchema
  if (input.positionX !== undefined) updates.positionX = input.positionX
  if (input.positionY !== undefined) updates.positionY = input.positionY

  await db.transaction(async (tx) => {
    const [result] = await tx
      .update(apiDesignSchemasTable)
      .set(updates)
      .where(
        and(
          eq(apiDesignSchemasTable.id, input.schemaId),
          eq(apiDesignSchemasTable.apiDesignId, input.apiDesignId),
        ),
      )
      .returning({ id: apiDesignSchemasTable.id })

    if (!result) {
      throw new Error('Schema not found.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}

export async function deleteSchema(input: {
  schemaId: string
  apiDesignId: string
  workspaceId: string
}): Promise<void> {
  const design = await resolveDesignOwnership(
    input.apiDesignId,
    input.workspaceId,
  )

  if (!design) {
    throw new Error('API design not found.')
  }

  await db.transaction(async (tx) => {
    const [result] = await tx
      .delete(apiDesignSchemasTable)
      .where(
        and(
          eq(apiDesignSchemasTable.id, input.schemaId),
          eq(apiDesignSchemasTable.apiDesignId, input.apiDesignId),
        ),
      )
      .returning({ id: apiDesignSchemasTable.id })

    if (!result) {
      throw new Error('Schema not found.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}
