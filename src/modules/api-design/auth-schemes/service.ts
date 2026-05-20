import 'server-only'
import { and, eq } from 'drizzle-orm'

import { db } from '@/shared/db/client'
import { apiDesignAuthSchemesTable, apiDesignsTable } from '@/shared/db/schema'
import { resolveDesignOwnership } from '@/modules/api-design/service'

export type AuthSchemeType = 'bearer' | 'apiKey' | 'oauth2' | 'openIdConnect'

export async function createAuthScheme(input: {
  apiDesignId: string
  workspaceId: string
  name: string
  type: AuthSchemeType
  config: unknown
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
    const [authScheme] = await tx
      .insert(apiDesignAuthSchemesTable)
      .values({
        apiDesignId: input.apiDesignId,
        name: input.name,
        type: input.type,
        config: input.config,
        positionX: input.positionX,
        positionY: input.positionY,
      })
      .returning({ id: apiDesignAuthSchemesTable.id })

    if (!authScheme) {
      throw new Error('Failed to create auth scheme.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))

    return { id: authScheme.id }
  })
}

export async function updateAuthScheme(input: {
  authSchemeId: string
  apiDesignId: string
  workspaceId: string
  name?: string
  type?: AuthSchemeType
  config?: unknown
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

  const updates: Partial<typeof apiDesignAuthSchemesTable.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (input.name !== undefined) updates.name = input.name
  if (input.type !== undefined) updates.type = input.type
  if (input.config !== undefined) updates.config = input.config
  if (input.positionX !== undefined) updates.positionX = input.positionX
  if (input.positionY !== undefined) updates.positionY = input.positionY

  await db.transaction(async (tx) => {
    const [result] = await tx
      .update(apiDesignAuthSchemesTable)
      .set(updates)
      .where(
        and(
          eq(apiDesignAuthSchemesTable.id, input.authSchemeId),
          eq(apiDesignAuthSchemesTable.apiDesignId, input.apiDesignId),
        ),
      )
      .returning({ id: apiDesignAuthSchemesTable.id })

    if (!result) {
      throw new Error('Auth scheme not found.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}

export async function deleteAuthScheme(input: {
  authSchemeId: string
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
      .delete(apiDesignAuthSchemesTable)
      .where(
        and(
          eq(apiDesignAuthSchemesTable.id, input.authSchemeId),
          eq(apiDesignAuthSchemesTable.apiDesignId, input.apiDesignId),
        ),
      )
      .returning({ id: apiDesignAuthSchemesTable.id })

    if (!result) {
      throw new Error('Auth scheme not found.')
    }

    await tx
      .update(apiDesignsTable)
      .set({ updatedAt: new Date() })
      .where(eq(apiDesignsTable.id, input.apiDesignId))
  })
}
