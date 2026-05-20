import 'server-only'
import * as z from 'zod'
import { protectedProcedure } from '@/modules/auth/orpc-middleware'
import * as resourceService from './service'

export const createResourceProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
      name: z.string().min(1).max(120),
      description: z.string().nullable().optional(),
      positionX: z.number(),
      positionY: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    return resourceService.createResource({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const updateResourceProc = protectedProcedure
  .input(
    z.object({
      resourceId: z.string(),
      apiDesignId: z.string(),
      name: z.string().min(1).max(120).optional(),
      description: z.string().nullable().optional(),
      positionX: z.number().optional(),
      positionY: z.number().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    await resourceService.updateResource({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const deleteResourceProc = protectedProcedure
  .input(
    z.object({
      resourceId: z.string(),
      apiDesignId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    await resourceService.deleteResource({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const resourceRouter = {
  create: createResourceProc,
  update: updateResourceProc,
  delete: deleteResourceProc,
}
