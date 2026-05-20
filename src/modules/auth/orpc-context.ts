import 'server-only'
import { getServerSession } from './server'
import { getEffectiveWorkspaceId } from './workspace'

export type ORPCAuthContext = {
  user: NonNullable<Awaited<ReturnType<typeof getServerSession>>>['user'] | null
  workspaceId: string | null
}

export async function createORPCAuthContext(): Promise<ORPCAuthContext> {
  const session = await getServerSession()

  if (!session) {
    return { user: null, workspaceId: null }
  }

  const workspaceId =
    (await getEffectiveWorkspaceId(
      session.user.id,
      session.session.activeOrganizationId,
    )) ?? null

  return { user: session.user, workspaceId }
}
