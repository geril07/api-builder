import 'server-only'
import { os, ORPCError } from '@orpc/server'
import type { ORPCAuthContext } from './orpc-context'

const base = os.$context<ORPCAuthContext>()

export const publicProcedure = base

export const protectedProcedure = base.use(async ({ context, next }) => {
  if (!context.user || !context.workspaceId) {
    throw new ORPCError('UNAUTHORIZED')
  }

  return next({
    context: {
      user: context.user,
      workspaceId: context.workspaceId,
    },
  })
})
