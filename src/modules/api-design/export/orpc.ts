import 'server-only'
import * as z from 'zod'
import { protectedProcedure } from '@/modules/auth/orpc-middleware'
import * as exportService from './service'

export const exportApiDesignProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
      format: z.enum(['json', 'yaml', 'postman']),
    }),
  )
  .handler(async ({ input, context }) => {
    return exportService.exportApiDesign(
      input.apiDesignId,
      context.workspaceId,
      input.format,
    )
  })

export const exportRouter = {
  export: exportApiDesignProc,
}
