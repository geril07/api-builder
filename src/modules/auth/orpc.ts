import 'server-only'

import { publicProcedure } from './orpc-middleware'

export const getCurrentAuthProc = publicProcedure.handler(
  async ({ context }) => {
    return {
      user: context.user,
      workspaceId: context.workspaceId,
    }
  },
)

export const authRouter = {
  current: getCurrentAuthProc,
}
