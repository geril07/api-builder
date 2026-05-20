import 'server-only'
import * as z from 'zod'
import { protectedProcedure } from '@/modules/auth/orpc-middleware'
import { VALID_METHODS } from './http-methods'
import * as endpointService from './service'

const queryParamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  required: z.boolean().optional(),
  type: z.enum(['string', 'number', 'integer', 'boolean']).optional(),
  allowMultiple: z.boolean().optional(),
})

export const createEndpointProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
      resourceId: z.string(),
      method: z.enum(VALID_METHODS),
      path: z.string().min(1).max(255),
      summary: z.string().nullable().optional(),
      requestBody: z.string().nullable().optional(),
      responseShape: z.string().nullable().optional(),
      requestBodySchemaId: z.string().nullable().optional(),
      responseShapeSchemaId: z.string().nullable().optional(),
      authSchemeIds: z.array(z.string()).optional(),
      queryParams: z.array(queryParamSchema).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    return endpointService.createEndpoint({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const updateEndpointProc = protectedProcedure
  .input(
    z.object({
      endpointId: z.string(),
      apiDesignId: z.string(),
      method: z.enum(VALID_METHODS).optional(),
      path: z.string().min(1).max(255).optional(),
      summary: z.string().nullable().optional(),
      requestBody: z.string().nullable().optional(),
      responseShape: z.string().nullable().optional(),
      requestBodySchemaId: z.string().nullable().optional(),
      responseShapeSchemaId: z.string().nullable().optional(),
      authSchemeIds: z.array(z.string()).optional(),
      queryParams: z.array(queryParamSchema).optional(),
    }),
  )
  .handler(async ({ input, context }) => {
    await endpointService.updateEndpoint({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const deleteEndpointProc = protectedProcedure
  .input(
    z.object({
      endpointId: z.string(),
      apiDesignId: z.string(),
    }),
  )
  .handler(async ({ input, context }) => {
    await endpointService.deleteEndpoint({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const reorderEndpointsProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
      resourceId: z.string(),
      endpointIds: z.array(z.string()),
    }),
  )
  .handler(async ({ input, context }) => {
    await endpointService.reorderEndpoints({
      ...input,
      workspaceId: context.workspaceId,
    })
  })

export const endpointRouter = {
  create: createEndpointProc,
  update: updateEndpointProc,
  delete: deleteEndpointProc,
  reorder: reorderEndpointsProc,
}
