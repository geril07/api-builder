import 'server-only'
import * as z from 'zod'
import { protectedProcedure } from '@/modules/auth/orpc-middleware'
import * as schemaService from './service'

export const createSchemaProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
      name: z.string().min(1).max(120),
      description: z.string().nullable().optional(),
      jsonSchema: z.unknown(),
      positionX: z.number(),
      positionY: z.number(),
    }),
  )
  .handler(async ({ input, context }) => {
    return schemaService.createSchema({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const updateSchemaProc = protectedProcedure
  .input(
    z.object({
      schemaId: z.string(),
      apiDesignId: z.string(),
      name: z.string().min(1).max(120).optional(),
      description: z.string().nullable().optional(),
      jsonSchema: z.unknown().optional(),
      positionX: z.number().optional(),
      positionY: z.number().optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    await schemaService.updateSchema({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const deleteSchemaProc = protectedProcedure
  .input(
    z.object({
      schemaId: z.string(),
      apiDesignId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    await schemaService.deleteSchema({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const schemaRouter = {
  create: createSchemaProc,
  update: updateSchemaProc,
  delete: deleteSchemaProc,
}
