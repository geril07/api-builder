import 'server-only'
import { ORPCError } from '@orpc/server'
import * as z from 'zod'
import { protectedProcedure } from '@/modules/auth/orpc-middleware'
import * as apiDesignService from './service'

export const createApiDesignProc = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1).max(120),
    }),
  )
  .handler(async ({ input, context }) => {
    return apiDesignService.createApiDesign({
      name: input.name,
      workspaceId: context.workspaceId,
      createdById: context.user.id,
    })
  })

export const renameApiDesignProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
      name: z.string().min(1).max(120),
    }),
  )
  .handler(async ({ input, context }) => {
    return apiDesignService.renameApiDesign({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const deleteApiDesignProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    return apiDesignService.deleteApiDesign({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const listApiDesignsProc = protectedProcedure.handler(
  async ({ context }) => {
    return apiDesignService.listApiDesigns(context.workspaceId)
  },
)

export const getApiDesignDataProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    const data = await apiDesignService.getApiDesignData(
      input.apiDesignId,
      context.workspaceId,
    )

    if (!data) {
      throw new ORPCError('NOT_FOUND')
    }

    return data
  })

const positionItemSchema = z.object({
  id: z.string(),
  positionX: z.number(),
  positionY: z.number(),
})

export const autoLayoutProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
      resources: z.array(positionItemSchema),
      schemas: z.array(positionItemSchema),
      authSchemes: z.array(positionItemSchema),
    }),
  )
  .handler(async ({ input, context }) => {
    await apiDesignService.autoLayout({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const apiDesignRouter = {
  create: createApiDesignProc,
  rename: renameApiDesignProc,
  delete: deleteApiDesignProc,
  list: listApiDesignsProc,
  get: getApiDesignDataProc,
  autoLayout: autoLayoutProc,
}
