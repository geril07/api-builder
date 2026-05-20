import 'server-only'
import { cache } from 'react'
import { createRouterClient } from '@orpc/server'
import { orpcRouter } from './router'
import { createORPCAuthContext } from '@/modules/auth/orpc-context'

export const createOrpcServerClient = cache(
  async function createOrpcServerClient() {
    return createRouterClient(orpcRouter, {
      context: await createORPCAuthContext(),
    })
  },
)
