import 'server-only'
import * as z from 'zod'
import { protectedProcedure } from '@/modules/auth/orpc-middleware'
import * as authSchemeService from './service'

export const createAuthSchemeProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
      name: z.string().min(1).max(120),
      type: z.enum(['bearer', 'apiKey', 'oauth2', 'openIdConnect']),
      config: z.unknown(),
      positionX: z.number(),
      positionY: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    return authSchemeService.createAuthScheme({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const updateAuthSchemeProc = protectedProcedure
  .input(
    z.object({
      authSchemeId: z.string(),
      apiDesignId: z.string(),
      name: z.string().min(1).max(120).optional(),
      type: z.enum(['bearer', 'apiKey', 'oauth2', 'openIdConnect']).optional(),
      config: z.unknown().optional(),
      positionX: z.number().optional(),
      positionY: z.number().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    await authSchemeService.updateAuthScheme({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const deleteAuthSchemeProc = protectedProcedure
  .input(
    z.object({
      authSchemeId: z.string(),
      apiDesignId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    await authSchemeService.deleteAuthScheme({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const authSchemeRouter = {
  create: createAuthSchemeProc,
  update: updateAuthSchemeProc,
  delete: deleteAuthSchemeProc,
}
