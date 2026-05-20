import 'server-only'
import * as z from 'zod'
import { protectedProcedure } from '@/modules/auth/orpc-middleware'
import { agent } from './service'

export const agentProc = protectedProcedure
  .input(
    z.object({
      apiDesignId: z.string(),
      messages: z.array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
        }),
      ),
    }),
  )
  .handler(async ({ input, context }) => {
    return agent(input.apiDesignId, context.workspaceId, input.messages)
  })

export const aiRouter = {
  agent: agentProc,
}
