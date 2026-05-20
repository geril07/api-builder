import 'server-only'

import { and, eq } from 'drizzle-orm'

import { db } from '@/shared/db/client'
import { membersTable, organizationsTable } from '@/shared/db/schema'

export async function getEffectiveWorkspace(
  userId: string,
  activeWorkspaceId?: string | null,
) {
  if (activeWorkspaceId) {
    const [activeWorkspace] = await db
      .select({ id: organizationsTable.id, name: organizationsTable.name })
      .from(membersTable)
      .innerJoin(
        organizationsTable,
        eq(membersTable.organizationId, organizationsTable.id),
      )
      .where(
        and(
          eq(membersTable.userId, userId),
          eq(membersTable.organizationId, activeWorkspaceId),
        ),
      )
      .limit(1)

    if (activeWorkspace) {
      return activeWorkspace
    }
  }

  const [personalWorkspace] = await db
    .select({ id: organizationsTable.id, name: organizationsTable.name })
    .from(membersTable)
    .innerJoin(
      organizationsTable,
      eq(membersTable.organizationId, organizationsTable.id),
    )
    .where(
      and(
        eq(membersTable.userId, userId),
        eq(organizationsTable.slug, `personal-${userId}`),
      ),
    )
    .limit(1)

  return personalWorkspace
}

export async function getEffectiveWorkspaceId(
  userId: string,
  activeWorkspaceId?: string | null,
) {
  const ws = await getEffectiveWorkspace(userId, activeWorkspaceId)
  return ws?.id
}
