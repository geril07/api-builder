import type { RouterClient } from '@orpc/server'
import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'

const link = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('Use @/app/api/orpc/server-client for server-side calls')
    }
    return `${window.location.origin}/api/orpc`
  },
})

export const orpcClient = createORPCClient(link) as RouterClient<AppOrpcRouter>

export const orpcTQ = createTanstackQueryUtils(orpcClient)
