import 'server-only'
import { apiDesignRouter } from '@/modules/api-design/server'
import { endpointRouter } from '@/modules/api-design/endpoints/server'
import { resourceRouter } from '@/modules/api-design/resources/server'
import { schemaRouter } from '@/modules/api-design/schemas/server'
import { authSchemeRouter } from '@/modules/api-design/auth-schemes/server'
import { aiRouter } from '@/modules/api-design/assistant/server'
import { exportRouter } from '@/modules/api-design/export/server'
import { authRouter } from '@/modules/auth/orpc'

export const orpcRouter = {
  auth: authRouter,
  apiDesign: {
    ...apiDesignRouter,
    endpoint: endpointRouter,
    resource: resourceRouter,
    schema: schemaRouter,
    authScheme: authSchemeRouter,
    ai: aiRouter,
    export: exportRouter,
  },
}

export type OrpcRouter = typeof orpcRouter

declare global {
  type AppOrpcRouter = OrpcRouter
}
